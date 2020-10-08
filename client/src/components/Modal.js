import React from 'react';
import '../styles/Modal.css';

const Modal = ({ handleClose, show, characters }) => {
  const showHideClassName = show ? "modal display-block" : "modal display-none";

  return (
    <div className={showHideClassName}>
      <section className="modal-main">
		{
			characters.map(char => 
	            <div>
		            <p>{char.text}</p>
		            <p>{char.english}</p>
            	</div>
          )}
        <button onClick={handleClose}>close</button>
      </section>
    </div>
  );
};

export default Modal;