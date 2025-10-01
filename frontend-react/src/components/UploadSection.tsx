import React from 'react';

interface UploadSectionProps {
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    loadDemoFile: () => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ handleFileChange, loadDemoFile }) => {
    return (
        <div className="flex flex-col items-start gap-3 mb-6">
        <button
            className="w-60 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg shadow-sm transition"
        >
            Dataset
        </button>
        
        <button
            className="w-60 px-4 py-3 bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium rounded-lg shadow-sm transition"
        >
            Test Data
        </button>
        </div>
    );
};

export default UploadSection;
