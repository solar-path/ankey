import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, File, AlertCircle, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImportService, type ImportResult } from '@/lib/import.service'

interface FileUploadProps {
  onImportComplete: (result: ImportResult) => void
  columns: Array<{
    key: string
    label: string
    required?: boolean
    type?: 'string' | 'number' | 'date' | 'boolean'
  }>
  acceptedFileTypes?: string[]
  maxFileSize?: number
  className?: string
}

export function FileUpload({
  onImportComplete,
  columns,
  acceptedFileTypes = ['.xlsx', '.xls', '.csv'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className,
}: FileUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const processFile = async (file: File) => {
    setIsProcessing(true)
    try {
      let result: ImportResult
      const fileExtension = file.name.toLowerCase().split('.').pop()

      if (fileExtension === 'csv') {
        result = await ImportService.parseCSVFile(file, columns)
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        result = await ImportService.parseExcelFile(file, columns)
      } else {
        throw new Error('Unsupported file format')
      }

      setImportResult(result)
      onImportComplete(result)
    } catch (error) {
      const errorResult: ImportResult = {
        success: false,
        data: [],
        errors: [{ row: 0, message: `Import failed: ${error}` }],
        summary: {
          totalRows: 0,
          validRows: 0,
          errorRows: 1,
          newRecords: 0,
          updatedRecords: 0,
        },
      }
      setImportResult(errorResult)
      onImportComplete(errorResult)
    } finally {
      setIsProcessing(false)
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        setUploadedFile(file)
        setImportResult(null)
        processFile(file)
      }
    },
    [columns, onImportComplete]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: maxFileSize,
  })

  const clearFile = () => {
    setUploadedFile(null)
    setImportResult(null)
  }

  return (
    <div className={className}>
      {!uploadedFile && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop the file here' : 'Upload a file'}
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop your Excel (.xlsx, .xls) or CSV file here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Max file size: {Math.round(maxFileSize / 1024 / 1024)}MB
          </p>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">File Upload Error</h3>
          </div>
          <div className="mt-2">
            {fileRejections.map((rejection, index) => (
              <div key={index} className="text-sm text-red-700">
                {rejection.file.name}: {rejection.errors.map((e: any) => e.message).join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {uploadedFile && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <File className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={clearFile} disabled={isProcessing}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isProcessing && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                <span className="text-sm text-gray-600">Processing file...</span>
              </div>
            </div>
          )}

          {importResult && !isProcessing && (
            <div className="mt-4">
              <div
                className={`flex items-center mb-3 ${
                  importResult.success ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <span className="font-medium">
                  {importResult.success
                    ? 'Import completed successfully'
                    : 'Import completed with errors'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-2 bg-white rounded border">
                  <div className="font-semibold">{importResult.summary.totalRows}</div>
                  <div className="text-gray-600">Total Rows</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded border">
                  <div className="font-semibold text-green-700">
                    {importResult.summary.validRows}
                  </div>
                  <div className="text-gray-600">Valid Rows</div>
                </div>
                <div className="text-center p-2 bg-red-50 rounded border">
                  <div className="font-semibold text-red-700">{importResult.summary.errorRows}</div>
                  <div className="text-gray-600">Error Rows</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded border">
                  <div className="font-semibold text-blue-700">
                    {importResult.summary.newRecords}
                  </div>
                  <div className="text-gray-600">New Records</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Import Errors:</h4>
                  <div className="max-h-40 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        Row {error.row}: {error.message}
                        {error.column && ` (Column: ${error.column})`}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <div className="text-sm text-gray-600 italic">
                        ... and {importResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
