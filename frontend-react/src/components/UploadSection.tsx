import React, { useRef, useState } from 'react';

interface UploadSectionProps {
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loadDemoFile: () => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ handleFileChange, loadDemoFile }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const openFileDialog = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e); // call your parent handler
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name); // store the chosen file name
    }
  };

    return (
        <div className="flex flex-col items-start gap-3 mb-6">
            {/* Button + filename in one row */}
            <div className="flex items-center w-full">
                <button
                    type="button"
                    onClick={openFileDialog}
                    className="w-60 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg shadow-sm transition"
                >
                    Open Dataset
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={onFileChange}
                    hidden
                />

                {fileName && (
                    <span className="ml-4 text-sm text-slate-600">
                    Selected: <span className="font-semibold">{fileName}</span>
                    </span>
                )}
            </div>

            {/* Second button below */}
            <button
            type="button"
            onClick={loadDemoFile}
            className="w-60 px-4 py-3 bg-sky-100 hover:bg-sky-200 text-sky-700 font-medium rounded-lg shadow-sm transition"
            >
            Use Test Data
            </button>
        </div>
    );
};

export default UploadSection;
