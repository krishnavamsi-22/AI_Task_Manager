import './VoiceModal.css';

export default function VoiceModal({ 
  isOpen, 
  isListening, 
  isProcessing, 
  transcript, 
  onStart, 
  onStop, 
  onCancel,
  onTranscriptChange
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(10px)' }}>
      <div className="voice-modal" onClick={(e) => e.stopPropagation()}>
        <div className="voice-modal-header">
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.75rem', 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', 
            WebkitBackgroundClip: 'text', 
            backgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            🎤 Voice Task Creation
          </h2>
          <button 
            onClick={onCancel} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '2rem', 
              cursor: 'pointer', 
              color: '#94a3b8' 
            }}
          >
            ×
          </button>
        </div>
        
        <div className="voice-visualizer">
          {isListening ? (
            <div className="voice-wave-container">
              <div className="voice-wave"></div>
              <div className="voice-wave"></div>
              <div className="voice-wave"></div>
              <div className="voice-wave"></div>
              <div className="voice-wave"></div>
            </div>
          ) : (
            <div className="voice-mic-icon">🎤</div>
          )}
        </div>
        
        <div className="voice-status">
          {isProcessing ? (
            <>
              <div className="voice-spinner"></div>
              <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#6366f1', margin: '1rem 0 0 0' }}>
                Processing your voice...
              </p>
            </>
          ) : isListening ? (
            <>
              <div className="voice-pulse"></div>
              <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#ef4444', margin: '1rem 0 0 0' }}>
                Listening... Speak now!
              </p>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.5rem 0 0 0' }}>
                Describe your task with title, skills, priority, and hours
              </p>
            </>
          ) : (
            <p style={{ fontSize: '1rem', color: '#64748b', margin: '1rem 0 0 0' }}>
              Click the button below to start
            </p>
          )}
        </div>
        
        {!transcript && !isListening && (
          <div className="voice-transcript">
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: '#6366f1', 
              marginBottom: '0.5rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Or type your task description:
            </div>
            <textarea 
              placeholder="Describe your task here... e.g., 'Create a high priority React dashboard with authentication, needs 40 hours'"
              onChange={(e) => {
                if (typeof onTranscriptChange === 'function') {
                  onTranscriptChange(e.target.value);
                }
              }}
              style={{ 
                width: '100%',
                minHeight: '100px',
                fontSize: '0.9375rem', 
                color: '#1e293b', 
                lineHeight: 1.6,
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>
        )}
        
        {transcript && (
          <div className="voice-transcript">
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: '#6366f1', 
              marginBottom: '0.5rem', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Transcript (editable):
            </div>
            <textarea 
              value={transcript}
              onChange={(e) => {
                // Allow manual editing of transcript
                if (typeof onTranscriptChange === 'function') {
                  onTranscriptChange(e.target.value);
                }
              }}
              style={{ 
                width: '100%',
                minHeight: '80px',
                fontSize: '0.9375rem', 
                color: '#1e293b', 
                lineHeight: 1.6,
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Your voice input will appear here... You can also edit it directly."
            />
          </div>
        )}
        
        <div className="voice-controls">
          {!isListening && !isProcessing && (
            <>
              <button onClick={onStart} className="voice-btn voice-btn-start">
                <span style={{ fontSize: '1.5rem' }}>🎤</span>
                Start Speaking
              </button>
              {transcript && (
                <button 
                  onClick={onStop} 
                  className="voice-btn voice-btn-process"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>✨</span>
                  Process Text
                </button>
              )}
            </>
          )}
          {isListening && (
            <button onClick={onStop} className="voice-btn voice-btn-stop">
              <span style={{ fontSize: '1.5rem' }}>⏹️</span>
              Stop & Process
            </button>
          )}
          <button onClick={onCancel} className="voice-btn voice-btn-cancel" disabled={isProcessing}>
            Cancel
          </button>
        </div>
        
        <div className="voice-tips">
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            color: '#6366f1', 
            marginBottom: '0.75rem', 
            textTransform: 'uppercase' 
          }}>
            💡 Tips:
          </div>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '1.25rem', 
            fontSize: '0.8125rem', 
            color: '#64748b', 
            lineHeight: 1.8 
          }}>
            <li>Speak clearly and naturally</li>
            <li>Mention: task name, required skills, priority level, estimated hours</li>
            <li>Example: "Create a high priority React dashboard with authentication, needs 40 hours"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
