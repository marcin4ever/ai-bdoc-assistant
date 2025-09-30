import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const UploadSection = ({ handleFileChange, loadDemoFile }) => {
    return (_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsxs("label", { className: "cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md border border-gray-300", children: ["Choose Your JSON File", _jsx("input", { type: "file", accept: "application/json", onChange: handleFileChange, hidden: true })] }), _jsx("span", { className: "text-gray-500 font-medium", children: "or" }), _jsx("button", { onClick: loadDemoFile, className: "bg-gray-100 hover:bg-gray-200 text-gray-800 font-normal px-3 py-1 rounded-md border border-gray-300", children: "Use Demo Example" })] }));
};
export default UploadSection;
