import { ChangeEvent, FormEvent, useState } from 'react';
import CSVUploadModal from './CSVUploadModal';
import { DOMAIN_CONFIGS, getDomainKeys, getListTypesForDomain, DomainKey } from '../constants/domains';

interface NewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  // now accepts optional items parsed from CSV
  onSubmit: (title: string, domain: string, items?: any[]) => Promise<void> | void;
}

const domains = getDomainKeys();

const NewListModal = ({ isOpen, onClose, onSubmit }: NewListModalProps) => {
  const [selectedDomain, setSelectedDomain] = useState<DomainKey>(domains[0]);
  const [selectedListType, setSelectedListType] = useState<string>('');
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
  const [importedRows, setImportedRows] = useState<any[]>([]);

  // Update list type when domain changes
  const handleDomainChange = (domain: DomainKey) => {
    setSelectedDomain(domain);
    const listTypes = getListTypesForDomain(domain);
    setSelectedListType(listTypes[0] || '');
  };

  // Initialize list type on mount
  if (!selectedListType && selectedDomain) {
    const listTypes = getListTypesForDomain(selectedDomain);
    if (listTypes.length > 0) {
      setSelectedListType(listTypes[0]);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedListType.trim() && selectedDomain) {
      await onSubmit(selectedListType.trim(), selectedDomain, importedRows.length > 0 ? importedRows : undefined);
      // Reset form after successful submission
      setSelectedDomain(domains[0]);
      const listTypes = getListTypesForDomain(domains[0]);
      setSelectedListType(listTypes[0] || '');
      setImportedRows([]);
    }
  };

  const handleClose = () => {
    setSelectedDomain(domains[0]);
    const listTypes = getListTypesForDomain(domains[0]);
    setSelectedListType(listTypes[0] || '');
    setImportedRows([]);
    setIsCSVModalOpen(false);
    onClose();
  };

  const currentListTypes = getListTypesForDomain(selectedDomain);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Create New List</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            {/* Domain Selection */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Domain <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {domains.map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => handleDomainChange(domain)}
                    className={`
                      h-12 px-3 rounded-xl font-medium transition-all duration-200 text-sm
                      ${
                        selectedDomain === domain
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-2 border-slate-200'
                      }
                    `}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* List Type Selection */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                List Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedListType}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedListType(e.target.value)}
                required
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-700 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all duration-200 cursor-pointer"
              >
                {currentListTypes.map((listType) => (
                  <option key={listType} value={listType}>
                    {listType}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Select from predefined list types for {selectedDomain}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 mt-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCSVModalOpen(true)}
                className="h-12 px-4 rounded-xl border-2 border-primary bg-primary/5 text-primary font-semibold hover:bg-primary/10 transition-all duration-200"
              >
                Import CSV <span className="text-red-500">*</span>
              </button>
              {importedRows.length > 0 ? (
                <div className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {importedRows.length} rows ready to upload
                </div>
              ) : (
                <div className="text-sm font-medium text-red-500">
                  CSV import required
                </div>
              )}
            </div>

            <div className="flex gap-3 w-1/2 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedListType.trim() || importedRows.length === 0}
                className="flex-1 h-12 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Create List
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* CSV Upload Modal (shows preview & selection). CSVUploadModal returns chosen rows via onAdd */}
      <CSVUploadModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onAdd={(rows: any[]) => {
          setImportedRows(rows);
          setIsCSVModalOpen(false);
        }}
      />
    </div>
  );
};

export default NewListModal;
