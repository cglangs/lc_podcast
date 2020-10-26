import React from "react";

const ProgressBar = (props) => {
  const {stepAtInterval, currentTimeInterval, intervalOrder } = props;

const dotStyleEmpty = {
  height: "10px",
  width: "10px",
  "marginRight": "10px",
  "backgroundColor": "#bbb",
  "borderRadius": "50%",
  "display": "inline-block"
}

const textStyle = {
  "marginBlockStart": "1.2em",
  "fontSize": "10px",
  "color": "aquamarine"
}

const dotGroup = {
  "marginRight": "10px"
}

const dotStyleFullInterval1 = {
  height: "10px",
  width: "10px",
  "marginRight": "10px",
  "backgroundColor": "rgb(85 233 255)",
  "borderRadius": "50%",
  "display": "inline-block"
}

const dotStyleFullInterval2 = {
  height: "10px",
  width: "10px",
  "marginRight": "10px",
  "backgroundColor": "rgb(255 97 255)",
  "borderRadius": "50%",
  "display": "inline-block"
}

const dotStyleFullInterval3 = {
  height: "10px",
  width: "10px",
  "marginRight": "10px",
  "backgroundColor": "rgb(247 255 0)",
  "borderRadius": "50%",
  "display": "inline-block"
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
    <div style={{display: "flex", justifyContent: "flex-start", flexDirection: "row"}}>
      <div style={dotGroup}>
      <span style={currentTimeInterval >= 1 ? dotStyleFullInterval1 : dotStyleEmpty}></span>
      <span style={currentTimeInterval >= 2 ? dotStyleFullInterval1 : dotStyleEmpty}></span>
      <span style={currentTimeInterval >= 3 ? dotStyleFullInterval1 : dotStyleEmpty}></span>
      </div>
      <div style={dotGroup}>
      <span style={currentTimeInterval >= 4 ? dotStyleFullInterval2 : dotStyleEmpty}></span>
      <span style={currentTimeInterval >= 5 ? dotStyleFullInterval2 : dotStyleEmpty}></span>
      <span style={currentTimeInterval >= 6 ? dotStyleFullInterval2 : dotStyleEmpty}></span>
      </div>
      <div style={dotGroup}>
      <span style={currentTimeInterval >= 7 ? dotStyleFullInterval3 : dotStyleEmpty}></span>
      <span style={currentTimeInterval >= 8 ? dotStyleFullInterval3 : dotStyleEmpty}></span>
      <span style={currentTimeInterval >= 9 ? dotStyleFullInterval3 : dotStyleEmpty}></span>
      </div>
      <p style={textStyle}>{displayNewStatus()}</p>
    </div>
  );
};

export default ProgressBar;