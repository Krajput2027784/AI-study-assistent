import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Bot } from 'lucide-react';

export default function PDFView() {
  const { id } = useParams();

  return (
    <div className="flex h-[calc(100vh-2rem)]">
      <div className="flex-1 bg-gray-100 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4 bg-white p-2 rounded-lg shadow-sm">
          <button className="p-2"><ChevronLeft /></button>
          <span>Page 1 of 10</span>
          <button className="p-2"><ChevronRight /></button>
          <div className="flex gap-2">
            <button className="p-2"><ZoomIn /></button>
            <button className="p-2"><ZoomOut /></button>
          </div>
        </div>
        <div className="flex-1 bg-white shadow-lg flex items-center justify-center">
          PDF Viewer Mockup for material {id}
        </div>
      </div>
      <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bot /> Ask AI about this PDF</h2>
        <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">AI response will appear here...</p>
        </div>
        <input className="w-full p-3 border rounded-lg" placeholder="Ask a question..." />
      </div>
    </div>
  );
}

