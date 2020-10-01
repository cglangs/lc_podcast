import React, { Component } from 'react'
import '../styles/App.css';

class WordEdit extends Component {
	constructor(props){
    super(props)
    this.state = {
      text: props.location.state.text,
      english: props.location.state.english,
      italics: props.location.state.italics
    }
  }
	render(){
	  return (
	    <div className="App">
	      <header className="App-header">
	        <p>{this.state.text}</p>
	        <p>{this.state.english}</p>
	        <p>{this.state.italics}</p>
	      </header>
	    </div>
	  );
  	}
}

export default WordEdit;