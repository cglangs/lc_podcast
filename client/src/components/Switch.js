import React from 'react';
import '../styles/Switch.css';

const Switch = ({switchId, isOn, handleToggle, isDisabled }) => {
  return (
    <>
      <input
        checked={isOn}
        onChange={handleToggle}
        className="react-switch-checkbox"
        id={switchId ||`react-switch-new`}
        type="checkbox"
        disabled={isDisabled}
      />
      <label
        style={{ background: isOn && '#06D6A0' }}
        className="react-switch-label"
        htmlFor={switchId ||`react-switch-new`}
      >
        <span className={`react-switch-button`} />
      </label>
    </>
  );
};

export default Switch;