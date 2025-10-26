import { ChangeEvent, useEffect, useState } from 'react';
import { getLists, createList, resetToDefault } from '../api/listApi';
import ListCard from '../components/ListCard';
import NewListModal from '../components/NewListModal';

interface List {
  id: string;
  title: string;
  domain: string;
  description?: string;
  lastModified?: string;
  itemCount?: number;
}

const domains = ['All', 'Customer', 'Account', 'Marketing', 'Data'] as const;

const Dashboard = () => {
  const [lists, setLists] = useState<List[]>([]);
  const [domainFilter, setDomainFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await getLists();
        setLists(res);
      } catch (error) {
        console.error('Failed to fetch lists:', error);
      }
    };
    void fetchLists();
  }, []);

  const filteredLists = lists.filter((list: List) => {
    const matchesDomain = !domainFilter || list.domain === domainFilter;
    const matchesSearch =
      !searchQuery ||
      list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      list.domain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const handleDomainChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setDomainFilter(e.target.value);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
  };

  const handleCreateList = async (title: string, domain: string) => {
    try {
      await createList({ title, domain, items: [] });
      const updatedLists = await getLists();
      setLists(updatedLists);
      setIsNewListModalOpen(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Reset to default data? This will delete all your lists.')) {
      const defaultLists = await resetToDefault();
      setLists(defaultLists);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Modern Header with Glass Effect */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-2xl blur-lg opacity-30"></div>
                <div className="relative flex items-center gap-3 px-4 py-2 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    PharmaDB
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6">
                <button
                  onClick={handleResetData}
                  className="text-sm font-medium text-slate-600 hover:text-primary transition-colors duration-200"
                >
                  Reset Data
                </button>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden md:block" />
              <button
                type="button"
                className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
                Pharmaceutical Lists
              </h2>
              <p className="text-slate-500 text-lg">
                Manage and analyze your pharmaceutical data
              </p>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              onClick={() => setIsNewListModalOpen(true)}
              type="button"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New List
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="text-sm font-medium text-slate-500 mb-1">Total Lists</div>
                <div className="text-3xl font-bold text-slate-800">{lists.length}</div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200 hover:border-secondary/30 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-secondary/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="text-sm font-medium text-slate-500 mb-1">Active Domains</div>
                <div className="text-3xl font-bold text-slate-800">{new Set(lists.map(l => l.domain)).size}</div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200 hover:border-success/30 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-success/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="text-sm font-medium text-slate-500 mb-1">Filtered</div>
                <div className="text-3xl font-bold text-slate-800">{filteredLists.length}</div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-white rounded-2xl p-5 border border-slate-200 hover:border-warning/30 hover:shadow-lg transition-all duration-300 group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-warning/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="text-sm font-medium text-slate-500 mb-1">Status</div>
                <div className="text-xl font-bold text-success flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-success shadow-lg shadow-success/50 animate-pulse"></div>
                  Active
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Domain Filter</label>
              <div className="relative">
                <select
                  value={domainFilter}
                  onChange={handleDomainChange}
                  className="w-full h-12 pl-4 pr-12 appearance-none rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 font-medium focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all duration-200 cursor-pointer"
                >
                  {domains.map((domain) => (
                    <option key={domain} value={domain === 'All' ? '' : domain}>
                      {domain}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by title or domain..."
                  className="w-full h-12 pl-12 pr-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                />
                <svg
                  className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLists.map((list, index) => (
            <div 
              key={list.id} 
              className="animate-fadeIn" 
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ListCard list={list} />
            </div>
          ))}
        </div>

        {filteredLists.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No lists found</h3>
            <p className="text-slate-500">Try adjusting your filters or create a new list</p>
          </div>
        )}
      </main>

      {/* New List Modal */}
      <NewListModal 
        isOpen={isNewListModalOpen}
        onClose={() => setIsNewListModalOpen(false)}
        onSubmit={handleCreateList}
      />
    </div>
  );
};

export default Dashboard;