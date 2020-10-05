import React, { Component } from 'react'
import { Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import '../styles/App.css';

const EDIT_WORD = gql`
  mutation editWord($word_id: Int!, $english: String, $italics: String) {
  	UpdateWord(word_id: $word_id, english: $english, italics: $italics){
  		word_id
  		text
  	}
  }
`

class WordEdit extends Component {
	constructor(props){
    super(props)
    this.state = {
      word_id: props.location.state.word_id,
      text: props.location.state.text,
      pinyin: props.location.state.pinyin,
      english: props.location.state.english,
      italics: props.location.state.italics
    }
  }
	render(){
	  return (
	    <div className="App">
	      <header className="App-header">
	        <p>{this.state.text}</p>
	        <p>{this.state.pinyin}</p>
	        <p>Translation</p>
            <input
              value={this.state.english}
              onChange={e => this.setState({ english: e.target.value })}
              type="english"
              placeholder="Enter word's english translation"
              style={{width: "250px"}}
            />
            <p>Notes</p>
	        <input
              value={this.state.italics}
              onChange={e => this.setState({ italics: e.target.value })}
              type="italics"
              placeholder="Enter word's extra notes"
              style={{width: "250px"}}
            />
            <Mutation mutation={EDIT_WORD}
               update={(store) => {
                   this.props.history.push({pathname: '/words' })                   
                }}
             >
	            {editWord => (
	              <button onClick={() => editWord({variables: {word_id: parseInt(this.state.word_id), english: this.state.english, italics: this.state.italics}})} disabled={this.state.english.length === 0}>
	              Submit
	              </button>
	            )}
             </Mutation>
	      </header>
	    </div>
	  );
  	}
}

export default WordEdit;