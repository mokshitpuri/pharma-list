from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from app.chatbot.state import ChatbotState
from app.chatbot.tools import DatabaseTools
from typing import Dict, Any

class ChatbotNodes:
    """Individual nodes in the LangGraph workflow"""
    
    def __init__(self, db_tools: DatabaseTools, llm: ChatOpenAI):
        self.db_tools = db_tools
        self.llm = llm
    
    def classify_query(self, state: ChatbotState) -> Dict[str, Any]:
        """Classify what type of query the user is asking"""
        
        classification_prompt = f"""
        Classify this user query into one of these categories:
        - version_comparison: Comparing different versions or asking about changes
        - history: Asking about timeline or evolution
        - attribution: Asking who worked on what
        - current_state: Asking about current/latest version
        
        User query: {state['user_query']}
        
        Respond with just the category name.
        """
        
        response = self.llm.invoke([HumanMessage(content=classification_prompt)])
        query_type = response.content.strip().lower()
        
        return {"query_type": query_type}
    
    def fetch_versions(self, state: ChatbotState) -> Dict[str, Any]:
        """Fetch version data from database"""
        # Extract request_id from state or context
        request_id = state.get('request_id', 1)  # You'll need to pass this
        
        versions = self.db_tools.get_all_versions(request_id)
        
        return {"versions": versions}
    
    def analyze_changes(self, state: ChatbotState) -> Dict[str, Any]:
        """Analyze changes between versions"""
        versions = state['versions']
        subdomain = state['subdomain']
        
        # Find version with most changes
        max_changes = 0
        most_dynamic_version = None
        all_changes = {}
        
        for i in range(1, len(versions)):
            prev_version = versions[i-1]
            curr_version = versions[i]
            
            changes = self.db_tools.compare_versions(
                prev_version['version_id'],
                curr_version['version_id'],
                subdomain
            )
            
            all_changes[curr_version['version_number']] = changes
            
            if changes['change_count'] > max_changes:
                max_changes = changes['change_count']
                most_dynamic_version = curr_version
        
        return {
            "changes": all_changes,
            "insights": {
                "most_dynamic_version": most_dynamic_version,
                "total_versions": len(versions),
                "current_version": versions[-1] if versions else None
            }
        }
    
    def generate_response(self, state: ChatbotState) -> Dict[str, Any]:
        """Generate final natural language response"""
        
        context = self._build_context(state)
        
        prompt = f"""
        You are a helpful assistant for a pharmaceutical lists management system.
        
        User Question: {state['user_query']}
        
        Context and Data:
        {context}
        
        Provide a clear, concise answer to the user's question using the data above.
        Include specific version numbers, change counts, and rationale when relevant.
        """
        
        response = self.llm.invoke([
            SystemMessage(content="You are a pharmaceutical data analyst assistant."),
            HumanMessage(content=prompt)
        ])
        
        return {"response": response.content}
    
    def _build_context(self, state: ChatbotState) -> str:
        """Build context string from state data"""
        context_parts = []
        
        if state.get('insights'):
            insights = state['insights']
            context_parts.append(f"Total Versions: {insights['total_versions']}")
            
            if insights.get('most_dynamic_version'):
                mdv = insights['most_dynamic_version']
                context_parts.append(
                    f"Most Dynamic Version: Version {mdv['version_number']}\n"
                    f"Change Type: {mdv['change_type']}\n"
                    f"Rationale: {mdv['change_rationale']}"
                )
            
            if insights.get('current_version'):
                cv = insights['current_version']
                context_parts.append(
                    f"Current Version: Version {cv['version_number']}"
                )
        
        if state.get('changes'):
            context_parts.append("\nChanges Between Versions:")
            for version_num, changes in state['changes'].items():
                context_parts.append(
                    f"  Version {version_num}: "
                    f"{changes['change_count']} changes "
                    f"({len(changes['added'])} added, {len(changes['removed'])} removed)"
                )
        
        return "\n".join(context_parts)