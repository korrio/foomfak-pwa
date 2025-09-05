import React, { useState } from 'react';
import WaveAnimation, { CSSWaveAnimation, PulseWaveAnimation } from './WaveAnimation';
import { Mic, Play, Square } from 'lucide-react';

// Test component to verify wave animations are working
const WaveAnimationTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Wave Animation Test</h2>
      
      <div className="space-y-6">
        {/* Test Controls */}
        <div className="flex justify-center">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`flex items-center px-6 py-3 rounded-lg text-white font-medium transition-colors ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start Recording
              </>
            )}
          </button>
        </div>

        {/* Wave Animations */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Default Wave Animation</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <WaveAnimation isRecording={isRecording} size="medium" color="#ef4444" />
              {!isRecording && <div className="text-xs text-gray-500">Click "Start Recording" to see animation</div>}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">CSS Wave Animation</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              <CSSWaveAnimation isRecording={isRecording} size="medium" color="#10b981" />
              {!isRecording && <div className="text-xs text-gray-500">Click "Start Recording" to see animation</div>}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Pulse Wave Animation</h3>
            <div className="bg-gray-100 p-4 rounded-lg flex justify-center">
              <PulseWaveAnimation isRecording={isRecording} size="medium" color="#8b5cf6" />
              {!isRecording && <div className="text-xs text-gray-500 ml-4 self-center">Click "Start Recording" to see animation</div>}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-medium mb-2">Combined Animation (Like in ActivityRecorder)</h3>
            <div className="bg-gray-100 p-4 rounded-lg">
              {isRecording && (
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-3">
                    <PulseWaveAnimation 
                      isRecording={isRecording} 
                      size="small"
                      color="#ef4444"
                    />
                    <WaveAnimation 
                      isRecording={isRecording} 
                      size="medium"
                      color="#ef4444"
                    />
                    <PulseWaveAnimation 
                      isRecording={isRecording} 
                      size="small"
                      color="#ef4444"
                    />
                  </div>
                </div>
              )}
              {!isRecording && <div className="text-xs text-gray-500">Click "Start Recording" to see combined animation</div>}
            </div>
          </div>
        </div>

        {/* Recording Status Indicator */}
        {isRecording && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 text-red-700">
                <Mic className="w-5 h-5" />
                <WaveAnimation 
                  isRecording={true} 
                  size="small"
                  color="#b91c1c"
                />
                <span className="text-sm font-medium">กำลังบันทึกเสียง</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaveAnimationTest;