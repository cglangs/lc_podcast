import React, { Component } from 'react'
import {Query, Mutation} from 'react-apollo';
import gql from 'graphql-tag';

import '../styles/App.css';


const MAKE_ATTEMPT = gql`
  mutation makeAttempt($userId: Int!, $sentenceId: Int!, $isCorrect: Boolean!) {
	makeClozeAttempt(userId: $userId, sentenceId: $sentenceId, isCorrect: $isCorrect)
  }

`


const GET_SENTENCE = gql`
  query getSentence {
	getNextSentence(dummy: 1) {
		_id
		next_sentence_id
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
	constructor(){
    super()
    this.state = {
    	isCorrect: false,
    	showAnswer: false,
    	userResponse: '',
    	correctResponse: {
    		text: '',
    		characters: []
    	}
    		

    }
    this.baseState = this.state 
  }


	checkAnswer(correct_response) {
		return correct_response === this.state.userResponse
	}

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
         			  <div>
         			  <input style={{float: "left"}} onChange={e => this.setState({ userResponse: e.target.value })}/>
         			  <p>{data.getNextSentence.display_text.replace("#","")}</p>
 						<Mutation mutation={MAKE_ATTEMPT}
                      	update={(store) => {
                        
                        	}
                      	}
                  		 >
                        {makeAttempt => (
                          <button
                            onClick={() => 
                              {

                                makeAttempt()
                              }
                          	}
                          >
                          Submit
                          </button>
                        )}
                    </Mutation>
                    </div>
                    <div>
         			  <p>{data.getNextSentence.english}</p>
         			  <p>{data.getNextSentence.word_taught.english}</p>
         			</div>
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