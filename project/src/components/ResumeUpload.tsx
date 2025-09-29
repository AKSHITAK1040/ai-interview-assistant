import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui/Button';
import * as pdfjsLib from 'pdfjs-dist';

// Load the PDF worker (works with most bundlers)
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ResumeUploadProps {
  onUpload: (file: File, extractedData: { name?: string; email?: string; phone?: string }) => void;
  isLoading?: boolean;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUpload, isLoading = false }) => {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const extractDataFromPDF = async (file: File): Promise<{ name?: string; email?: string; phone?: string }> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
    }

    const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
    const phoneMatch = fullText.match(/(\+?\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,5}[\s.-]?\d{4}/);
    const nameMatch = fullText.match(/^[A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2}/m);

    return {
      name: nameMatch?.[0],
      email: emailMatch?.[0],
      phone: phoneMatch?.[0],
    };
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadStatus('error');
      setErrorMessage('Please upload a PDF file only.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadStatus('error');
      setErrorMessage('File size must be less than 5MB.');
      return;
    }

    try {
      setUploadStatus('processing');
      setErrorMessage('');

      const extractedData = await extractDataFromPDF(file);
      setUploadStatus('success');
      onUpload(file, extractedData);
    } catch (error: any) {
      console.error('Error processing resume:', error?.message || error);
      setUploadStatus('error');
      setErrorMessage('Failed to process the resume. Please try again.');
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: isLoading || uploadStatus === 'processing',
  });

  // Extract props manually to avoid TS conflicts
  const rootProps = getRootProps();

  return (
    <div className="space-y-4">
      <motion.div
        ref={rootProps.ref as React.Ref<HTMLDivElement>}
        className={`
          relative p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploadStatus === 'success' ? 'border-green-400 bg-green-50' : ''}
          ${uploadStatus === 'error' ? 'border-red-400 bg-red-50' : ''}
          ${(isLoading || uploadStatus === 'processing') ? 'cursor-not-allowed opacity-50' : ''}
        `}
        onClick={rootProps.onClick}
        onDragEnter={rootProps.onDragEnter}
        onDragOver={rootProps.onDragOver}
        onDragLeave={rootProps.onDragLeave}
        onDrop={rootProps.onDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          {uploadStatus === 'processing' && (
            <div className="animate-spin mx-auto w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
          )}

          {uploadStatus === 'success' && (
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          )}

          {uploadStatus === 'error' && (
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          )}

          {uploadStatus === 'idle' && (
            <Upload className="w-12 h-12 text-gray-400 mx-auto" />
          )}

          <div>
            {uploadStatus === 'processing' && (
              <p className="text-blue-600 font-medium">Processing your resume...</p>
            )}
            {uploadStatus === 'success' && (
              <p className="text-green-600 font-medium">Resume uploaded successfully!</p>
            )}
            {uploadStatus === 'error' && (
              <p className="text-red-600 font-medium">{errorMessage}</p>
            )}
            {uploadStatus === 'idle' && (
              <>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop your resume here' : 'Upload your resume'}
                </p>
                <p className="text-sm text-gray-500">
                  Drag and drop your PDF resume, or click to browse
                </p>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {uploadStatus === 'error' && (
        <Button
          onClick={() => {
            setUploadStatus('idle');
            setErrorMessage('');
          }}
          variant="secondary"
          className="w-full"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};
