"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploader = FileUploader;
const react_1 = __importStar(require("react"));
const hooks_1 = require("../hooks");
function FileUploader({ uploadOptions, onUploadComplete, onUploadError, accept, multiple = false, className = '', style, showProgress = true, buttonText = 'Choose File', disableDragDrop = false, }) {
    const fileInputRef = (0, react_1.useRef)(null);
    const [isDragging, setIsDragging] = (0, react_1.useState)(false);
    const { uploadFile, isUploading, progress, error, result, reset } = (0, hooks_1.useFileUpload)();
    const handleFileSelect = async (files) => {
        if (!files || files.length === 0) {
            return;
        }
        const file = files[0];
        try {
            const uploadResult = await uploadFile(file, uploadOptions);
            onUploadComplete?.(uploadResult.fileId, uploadResult.fileName);
        }
        catch (err) {
            onUploadError?.(err);
        }
    };
    const handleInputChange = (e) => {
        handleFileSelect(e.target.files);
    };
    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };
    const handleDragEnter = (e) => {
        if (disableDragDrop)
            return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e) => {
        if (disableDragDrop)
            return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e) => {
        if (disableDragDrop)
            return;
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e) => {
        if (disableDragDrop)
            return;
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };
    const containerStyle = {
        border: `2px dashed ${isDragging ? '#4285f4' : '#ccc'}`,
        borderRadius: '8px',
        padding: '32px',
        textAlign: 'center',
        backgroundColor: isDragging ? '#f0f7ff' : '#fafafa',
        transition: 'all 0.3s ease',
        cursor: disableDragDrop ? 'default' : 'pointer',
        ...style,
    };
    const buttonStyle = {
        backgroundColor: '#4285f4',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '12px 24px',
        fontSize: '16px',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        opacity: isUploading ? 0.6 : 1,
        transition: 'all 0.2s ease',
    };
    const progressBarStyle = {
        width: '100%',
        height: '8px',
        backgroundColor: '#e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden',
        marginTop: '16px',
    };
    const progressFillStyle = {
        height: '100%',
        backgroundColor: '#4285f4',
        width: `${progress?.percentage || 0}%`,
        transition: 'width 0.3s ease',
    };
    return (react_1.default.createElement("div", { className: className, style: containerStyle, onDragEnter: handleDragEnter, onDragLeave: handleDragLeave, onDragOver: handleDragOver, onDrop: handleDrop },
        react_1.default.createElement("input", { ref: fileInputRef, type: "file", accept: accept, multiple: multiple, onChange: handleInputChange, style: { display: 'none' }, disabled: isUploading }),
        !isUploading && !result && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("div", { style: { marginBottom: '16px' } },
                !disableDragDrop && (react_1.default.createElement("p", { style: { margin: '0 0 8px 0', color: '#666' } }, "Drag and drop a file here, or")),
                react_1.default.createElement("button", { onClick: handleButtonClick, style: buttonStyle, disabled: isUploading }, buttonText)))),
        isUploading && (react_1.default.createElement("div", null,
            react_1.default.createElement("p", { style: { margin: '0 0 8px 0', color: '#666' } }, "Uploading..."),
            showProgress && progress && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { style: progressBarStyle },
                    react_1.default.createElement("div", { style: progressFillStyle })),
                react_1.default.createElement("p", { style: { margin: '8px 0 0 0', color: '#666', fontSize: '14px' } },
                    progress.percentage,
                    "% (",
                    Math.round(progress.loaded / 1024),
                    " KB / ",
                    Math.round(progress.total / 1024),
                    " KB)"))))),
        result && (react_1.default.createElement("div", { style: { color: '#0f9d58' } },
            react_1.default.createElement("p", { style: { margin: '0 0 8px 0', fontWeight: 'bold' } }, "\u2713 Upload Complete!"),
            react_1.default.createElement("p", { style: { margin: '0', fontSize: '14px' } }, result.fileName),
            react_1.default.createElement("button", { onClick: reset, style: {
                    ...buttonStyle,
                    backgroundColor: '#666',
                    marginTop: '16px',
                } }, "Upload Another File"))),
        error && (react_1.default.createElement("div", { style: { color: '#d93025', marginTop: '16px' } },
            react_1.default.createElement("p", { style: { margin: '0', fontWeight: 'bold' } }, "\u2717 Upload Failed"),
            react_1.default.createElement("p", { style: { margin: '8px 0 0 0', fontSize: '14px' } }, error.message),
            react_1.default.createElement("button", { onClick: reset, style: {
                    ...buttonStyle,
                    backgroundColor: '#d93025',
                    marginTop: '16px',
                } }, "Try Again")))));
}
