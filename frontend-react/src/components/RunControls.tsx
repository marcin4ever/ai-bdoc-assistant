import React from 'react';

interface RunControlsProps {
    records: any[];
    runValidation: (useRAG: boolean) => void;
    temperature: number;
    setTemperature: React.Dispatch<React.SetStateAction<number>>;
    advancedTemp: boolean;
    setAdvancedTemp: React.Dispatch<React.SetStateAction<boolean>>;
    lastRun: boolean | null;
    setLastRun: React.Dispatch<React.SetStateAction<boolean | null>>;
    isValidating: boolean;
}

const RunControls: React.FC<RunControlsProps> = ({
    records,
    runValidation,
    temperature,
    setTemperature,
    advancedTemp,
    setAdvancedTemp,
    lastRun,
    setLastRun,
    isValidating,
}) => {

    if (records.length === 0) return null;

    return (
        <>
            <p className="text-green-600 mb-2">Loaded {records.length} records.</p>
            <div className="mb-4">
                <label className="font-semibold">Sensitivity: </label>

                {!advancedTemp ? (
                    <select
                        className="mt-1 border border-gray-300 rounded px-2 py-1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    >
                        <option value={0.0}>Strict</option>
                        <option value={0.7}>Balanced</option>
                        <option value={1.1}>Creative</option>
                    </select>
                ) : (
                    <input
                        type="range"
                        min="0.0"
                        max="1.5"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full mt-1"
                    />
                )}

                <div className="mt-2 flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={advancedTemp}
                        onChange={(e) => setAdvancedTemp(e.target.checked)}
                    />
                    <label className="text-sm text-gray-600">Adjust Sensitivity manually</label>
                </div>

                <p className="mt-1 text-sm text-gray-500">Current: {temperature.toFixed(1)}</p>
            </div>

            <div className="flex gap-4 mb-4 max-w-[480px] mx-auto">
                <button
                    onClick={() => {
                        setLastRun(false);
                        runValidation(false);
                    }}
                    disabled={isValidating}
                    className={`flex-1 font-bold py-2 px-4 rounded-xl transition duration-150
  text-white scale-100 transform
  ${isValidating ? "bg-gray-400 cursor-not-allowed" : lastRun === false ? "bg-blue-800 shadow-inner" : "bg-blue-600 hover:bg-blue-700 shadow-md"}`}
                >
                    Run Validation
                </button>

                <button
                    onClick={() => {
                        setLastRun(false);
                        runValidation(false);
                    }}
                    disabled={isValidating}
                    className={`flex-1 font-bold py-2 px-4 rounded-xl transition duration-150
  text-white scale-100 transform
  ${isValidating ? "bg-gray-400 cursor-not-allowed" : lastRun === false ? "bg-blue-800 shadow-inner" : "bg-blue-600 hover:bg-blue-700 shadow-md"}`}
                >
                    Run Validation
                </button>

            </div>
        </>
    );
};

export default RunControls;
