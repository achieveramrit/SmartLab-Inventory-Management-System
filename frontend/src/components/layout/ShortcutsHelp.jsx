import { KeyboardIcon, CloseIcon } from "../ui/Icons";

/**
 * ShortcutsHelp
 * Modal overlay listing all keyboard shortcuts available in the dashboard.
 * Props:
 *   onClose {() => void}
 */
function ShortcutsHelp({ onClose }) {
  return (
    <div
      className="shortcuts-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="shortcuts-modal">
        <div className="shortcuts-header">
          <div className="shortcuts-title-wrap">
            <KeyboardIcon size={18} />
            <h3>Keyboard Shortcuts</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon size={14} />
          </button>
        </div>

        <div className="shortcuts-body">
          <div className="shortcuts-section">
            <h4>Navigation</h4>
            <div className="shortcut-row"><kbd>1</kbd><span>Inventory catalog</span></div>
            <div className="shortcut-row"><kbd>2</kbd><span>Requests &amp; Issue module</span></div>
            <div className="shortcut-row"><kbd>P</kbd><span>My Profile &amp; Security</span></div>
            <div className="shortcut-row"><kbd>?</kbd><span>Toggle this help dialog</span></div>
            <div className="shortcut-row"><kbd>Esc</kbd><span>Close dialogs / drawer</span></div>
          </div>

          <div className="shortcuts-section">
            <h4>Pagination</h4>
            <div className="shortcut-row"><kbd>←</kbd><span>Previous page</span></div>
            <div className="shortcut-row"><kbd>→</kbd><span>Next page</span></div>
          </div>

          <div className="shortcuts-section">
            <h4>Actions</h4>
            <div className="shortcut-row"><kbd>T</kbd><span>Toggle Light / Dark theme</span></div>
            <div className="shortcut-row"><kbd>R</kbd><span>Refresh current module data</span></div>
            <div className="shortcut-row"><kbd>L</kbd><span>Log out of SmartLab</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShortcutsHelp;
