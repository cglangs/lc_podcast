import React, { Component } from 'react'
import {Query, Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import {getUserId} from '../constants.js'

import '../styles/App.css';


const MAKE_ATTEMPT = gql`
  mutation makeAttempt($userId: Int!, $sentenceId: Int!, $isCorrect: Boolean!, $nextIntervalSentenceId: Int,) {
	makeClozeAttempt(userId: $userId, sentenceId: $sentenceId, isCorrect: $isCorrect, nextIntervalSentenceId: $nextIntervalSentenceId)
  }

`


const GET_SENTENCE = gql`
  query getSentence {
	getNextSentence(dummy: 1) {
		_id
		next_interval_sentence_id
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
              const nextIntervalSentenceId = data.getNextSentence.next_interval_sentence_id ? parseInt(data.getNextSentence.next_interval_sentence_id) : null
     		  const sentenceId = parseInt(data.getNextSentence._id)
          	  const userId = parseInt(getUserId())
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
                              	//console.log(getUserId(),data.getNextSentence._id, this.checkAnswer(data.getNextSentence.word_taught.text),data.getNextSentence.next_interval_sentence_id)
                                makeAttempt({variables:{
                                	userId: userId,
                                	sentenceId: sentenceId,
                                	isCorrect: this.checkAnswer(data.getNextSentence.word_taught.text),
                                	nextIntervalSentenceId: nextIntervalSentenceId
                                }})
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