import React, { Component } from 'react'
import { Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import '../styles/App.css';

const EDIT_WORD = gql`
  mutation editWord($word_id: Int!,  $english: String!,  $pinyin: String!) {
  	EditWord(word_id: $word_id, english: $english, pinyin: $pinyin)
  }
`

class WordEdit extends Component {
	constructor(props){
    super(props)
    this.state = {
      word_id: props.location.state.word_id,
      word_text: props.location.state.word_text,
      pinyin: props.location.state.pinyin,
      english: props.location.state.english
    }
  }
	render(){
	  return (
	    <div className="App">
	      <header className="App-header">
	        <p>{this.state.word_text}</p>
	        <p>{this.state.pinyin}</p>
	        <p>Translation</p>
            <input
              value={this.state.english}
              onChange={e => this.setState({ english: e.target.value })}
              type="english"
              placeholder="Enter word's english translation"
              style={{width: "250px"}}
            />
            <input
              value={this.state.pinyin}
              onChange={e => this.setState({ pinyin: e.target.value })}
              type="pinyin"
              placeholder="Enter word's pinyin"
              style={{width: "250px"}}
            />
            <Mutation mutation={EDIT_WORD}
               update={(store) => {
                   this.props.history.push({pathname: '/' })                   
                }}
             >
	            {editWord => (
	              <button onClick={() => editWord({variables: {word_id: parseInt(this.state.word_id), pinyin: this.state.pinyin ,english: this.state.english}})} disabled={this.state.english.length === 0}>
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