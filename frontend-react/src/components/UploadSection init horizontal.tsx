import React from 'react';

interface UploadSectionProps {
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    loadDemoFile: () => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ handleFileChange, loadDemoFile }) => {
    return (
        <div className="flex items-center gap-4 mb-4">
            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md border border-gray-300">
                Choose Your JSON File
                <input type="file" accept="application/json" onChange={handleFileChange} hidden />
            </label>

            <span className="text-gray-500 font-medium">or</span>

            <button
                onClick={loadDemoFile}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-normal px-3 py-1 rounded-md border border-gray-300"
            >
                Use Demo Example
            </button>
        </div>
    );
};

export default UploadSection;
