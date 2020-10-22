import React from "react";

const ProgressBar = (props) => {
  const { bgcolor, stepAtInterval, currentTimeInterval, intervalOrder } = props;

  const dotStyleEmpty = {
  height: "10px",
  width: "10px",
  "marginRight": "10px",
  "background-color": "#bbb",
  "border-radius": "50%",
  "display": "inline-block"
}

  const dotStyleFull = {
  height: "10px",
  width: "10px",
  "marginRight": "10px",
  "background-color": bgcolor,
  "border-radius": "50%",
  "display": "inline-block"
}

const textStyle = {
  "margin-block-start": "0em",
  "font-size": "10px",
  "color": "aquamarine"
}

function displayNewStatus(){
  var textToShow = ""
  if(stepAtInterval === 1){
    if(intervalOrder === 1){
      textToShow = "New Word"
    } else {
      textToShow = "New Phrase"
    }
  }
  return textToShow
}


  return (
    <div style={{display: "flex", justifyContent: "flex-start"}}>
      <span style={stepAtInterval >= 2 ? dotStyleFull : dotStyleEmpty}></span>
      <span style={stepAtInterval >= 3 ? dotStyleFull : dotStyleEmpty}></span>
      <span style={currentTimeInterval/3 > intervalOrder ? dotStyleFull : dotStyleEmpty}></span>
      <p style={textStyle}>{displayNewStatus()}</p>
    </div>
  );
};

export default ProgressBar;