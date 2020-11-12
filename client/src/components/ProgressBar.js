import React from "react";

const ProgressBar = (props) => {
  const {currentTimeInterval} = props;

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

const dotStyleFullInterval = {
  height: "10px",
  width: "10px",
  "marginRight": "10px",
  "backgroundColor": "rgb(85 233 255)",
  "borderRadius": "50%",
  "display": "inline-block"
}


function displayNewStatus(){
  var textToShow = ""
  if(currentTimeInterval === 1){
    textToShow = "New Word"
  } 
  return textToShow
}


  return (
    <div style={{display: "flex", justifyContent: "flex-start", flexDirection: "row"}}>
      <div style={dotGroup}>
      {[1,2,3,4,5,6,7,8,9,10].map(interval_id => {
        return(
          <span style={currentTimeInterval >= interval_id ? dotStyleFullInterval : dotStyleEmpty}></span>
        )
      })}
      </div>
      <p style={textStyle}>{displayNewStatus()}</p>
    </div>
  );
};

export default ProgressBar;