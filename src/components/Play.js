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
			characters{
				text
				english
			}
		}

	}

  }

`

class Play extends Component {
	constructor(){
    super()
    this.state = {
    	showAnswer: false,
    	userResponse: ''
    }
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
         			  <input style={{float: "left"}} value={this.state.userResponse} onChange={e => this.setState({ userResponse: e.target.value })}/>
         			  <p>{data.getNextSentence.display_text.replace("#","")}</p>
 						<Mutation mutation={MAKE_ATTEMPT}
                      	update={(store) => {
                      		this.setState({
                      			showAnswer: true
                      		})
                        	}
                      	}
                  		 >
                        {makeAttempt => (
                          <button
                            onClick={() => 
                              {
                              	if(!this.state.showAnswer){
                              		makeAttempt({variables:{
	                                	userId: userId,
	                                	sentenceId: sentenceId,
	                                	isCorrect: this.checkAnswer(data.getNextSentence.word_taught.text),
	                                	nextIntervalSentenceId: nextIntervalSentenceId
                                	}})
                              	} else{
								    this.setState({
								        showAnswer: false,
								        userResponse: '',
								    }, () => {
								    	refetch()
								    })
                              	}

                              }
                          	}
                          >
                          {this.state.showAnswer ? "Next Sentence" : "Submit Answer"}
                          </button>
                        )}
                    </Mutation>
                    </div>
                    <div>
         			  <p>{data.getNextSentence.english}</p>
         			  <p>{data.getNextSentence.word_taught.english}</p>
         			</div>
         			{this.state.showAnswer && (
         					<div>
         					<p>{data.getNextSentence.pinyin}</p>
         					{data.getNextSentence.word_taught.characters.map(char => 
         						<div>
         						<p>{char.text}</p>
         						<p>{char.english}</p>
         						</div>

         					)}
         					</div>


         				)

         			}
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