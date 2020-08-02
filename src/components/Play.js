import React, { Component } from 'react'
import {Query} from 'react-apollo';
import gql from 'graphql-tag';

import '../styles/App.css';


const GET_SENTENCE = gql`
  query getSentence {
	getNextSentence(dummy: 1) {
		raw_text
		display_text
		pinyin
		english
		word_taught{
			text
			english
		}

	}

  }

`

class Play extends Component {
	render() {
	  return (
	    <div className="App">
	      <header className="App-header">
	      <Query query={GET_SENTENCE}>
	      	{({ loading, error, data, refetch }) => {
	      	  if (loading) return <div>Fetching</div>
              if (error) return <div>Error</div>
              return(
              	    <div>
         			  <p>{data.getNextSentence.raw_text}</p>
         			  <p>{data.getNextSentence.display_text}</p>
         			  <p>{data.getNextSentence.pinyin}</p>
         			  <p>{data.getNextSentence.english}</p>
         			  <p>{data.getNextSentence.word_taught.text}</p>
         			  <p>{data.getNextSentence.word_taught.english}</p>
         			</div>
              	) 



	      	}

	      }

	      </Query>

	      </header>
	    </div>
	  );		

	}
}

export default Play;