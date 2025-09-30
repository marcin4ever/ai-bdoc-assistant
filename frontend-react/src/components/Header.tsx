import React from 'react';

const Header = () => {
    return (
        <>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-blue-500 to-violet-600 text-center mb-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] font-orbitron tracking-wider uppercase">
                Smart Validator via React
            </h1>
            <p className="text-center font-medium text-gray-500 mb-6">
                Upload your data to validate records using LLaMA 3 or Mistral 7B. (Standalone mode, no backend connected)
            </p>
        </>
    );
};

export default Header;
