import React, { Component } from 'react'
import {Query} from 'react-apollo';
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
 						<Mutation mutation={TEST_MUTATION}
                      	update={(store) => {
                        
                        	}
                      	}
                  		 >
                        {testMutation => (
                          <button
                            onClick={() => 
                              {

                                testMutation()
                              }
                          	}
                          >
                          Submit
                          </button>
                        )}
                    </Mutation>
         			  <button onClick={() => this.checkAnswer(data.getNextSentence.word_taught.text)}>Submit</button>
         			  </div>
         			  <p>{data.getNextSentence.english}</p>
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