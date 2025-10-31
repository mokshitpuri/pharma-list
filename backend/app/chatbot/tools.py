from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from typing import List, Dict, Any, Optional
from app.models.list_versions import ListVersion
from app.models.work_logs import WorkLog
# Import all your entry models

class DatabaseTools:
    """Tools to query your Supabase database"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_all_versions(self, request_id: int) -> List[Dict[str, Any]]:
        """Fetch all versions for a request"""
        versions = self.db.query(ListVersion).filter(
            ListVersion.request_id == request_id
        ).order_by(ListVersion.version_number).all()
        
        return [self._version_to_dict(v) for v in versions]
    
    def get_version_entries(self, version_id: int, subdomain: str) -> List[Dict[str, Any]]:
        """Fetch entries for a specific version based on subdomain"""
        # Map subdomain to the correct entry table
        entry_model = self._get_entry_model(subdomain)
        
        entries = self.db.query(entry_model).filter(
            entry_model.version_id == version_id
        ).all()
        
        return [self._entry_to_dict(e) for e in entries]
    
    def compare_versions(self, version_id_1: int, version_id_2: int, 
                        subdomain: str) -> Dict[str, Any]:
        """Compare two versions and return differences"""
        entries_v1 = self.get_version_entries(version_id_1, subdomain)
        entries_v2 = self.get_version_entries(version_id_2, subdomain)
        
        # Convert to sets for comparison
        ids_v1 = {e['hcp_id'] for e in entries_v1 if 'hcp_id' in e}
        ids_v2 = {e['hcp_id'] for e in entries_v2 if 'hcp_id' in e}
        
        return {
            'added': list(ids_v2 - ids_v1),
            'removed': list(ids_v1 - ids_v2),
            'total_v1': len(entries_v1),
            'total_v2': len(entries_v2),
            'change_count': len(ids_v2 - ids_v1) + len(ids_v1 - ids_v2)
        }
    
    def get_work_logs(self, version_id: int) -> List[Dict[str, Any]]:
        """Fetch work logs for a version"""
        logs = self.db.query(WorkLog).filter(
            WorkLog.version_id == version_id
        ).order_by(WorkLog.activity_date).all()
        
        return [self._log_to_dict(log) for log in logs]
    
    def _get_entry_model(self, subdomain: str):
        """Map subdomain to entry model"""
        mapping = {
            'Target Lists': 'TargetListEntry',
            'Call Lists': 'CallListEntry',
            # Add all your subdomains here
        }
        # Return the appropriate model class
        pass
    
    def _version_to_dict(self, version: ListVersion) -> Dict[str, Any]:
        return {
            'version_id': version.version_id,
            'version_number': version.version_number,
            'change_type': version.change_type,
            'change_rationale': version.change_rationale,
            'created_by': version.created_by,
            'created_at': version.created_at.isoformat()
        }
    
    def _entry_to_dict(self, entry) -> Dict[str, Any]:
        # Convert SQLAlchemy model to dict
        return {c.name: getattr(entry, c.name) for c in entry.__table__.columns}
    
    def _log_to_dict(self, log: WorkLog) -> Dict[str, Any]:
        return {
            'worker_name': log.worker_name,
            'activity_description': log.activity_description,
            'decisions_made': log.decisions_made,
            'activity_date': log.activity_date.isoformat()
        }