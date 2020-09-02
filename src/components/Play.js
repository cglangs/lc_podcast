import React, { Component } from 'react'
import {Query, Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import {getUserName} from '../constants.js'
import { Howl } from 'howler';


import '../styles/App.css';


const MAKE_ATTEMPT = gql`
  mutation makeAttempt($userName: String!, $sentenceId: Int!, $isCorrect: Boolean!, $alreadySeen: Boolean!, $nextIntervalSentenceId: Int) {
	makeClozeAttempt(userName: $userName, sentenceId: $sentenceId, isCorrect: $isCorrect,alreadySeen: $alreadySeen, nextIntervalSentenceId: $nextIntervalSentenceId)
  }

`


const GET_SENTENCE = gql`
  query getSentence($userName: String!) {
	getNextSentence(userName: $userName) {
		_id
		next_interval_sentence_id
		raw_text
		display_text
		pinyin
		english
    interval{
      interval_order
    }
    current_users{
      user_name
    }
    already_seen
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

  SoundPlay() {
    const Sounds = new Howl({
      src: ["/1.mp3"]
    })
    Sounds.play()
    console.log("sound")
  }

	render() {
	  const userName = getUserName()
	  return (
	    <div className="App">
	      <header className="App-header">
	      <Query query={GET_SENTENCE} variables={{userName: userName}}>
	      	{({ loading, error, data, refetch }) => {
	      	  if (loading) return <div>Fetching</div>
            if (error) return <div>error</div>
            if(data.getNextSentence){
              const sentenceId = parseInt(data.getNextSentence._id)
              const alreadySeenWord = data.getNextSentence.already_seen
              var nextIntervalSentenceId = null
              if(data.getNextSentence.next_interval_sentence_id && alreadySeenWord){
                nextIntervalSentenceId = data.getNextSentence.next_interval_sentence_id
              } else if((data.getNextSentence.next_interval_sentence_id || /*Only necessary because of missing data*/ data.getNextSentence.interval.interval_order < 5) && !alreadySeenWord){
                //else if(data.getNextSentence.next_interval_sentence_id && !alreadySeenWord){
                nextIntervalSentenceId = parseInt(sentenceId)
              }
                return(
                  <div>
                  <div>
                    <button onClick={this.SoundPlay}>play</button>
                    {alreadySeenWord && <p>{data.getNextSentence.english}</p>}
                    <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
                    {alreadySeenWord && <p>{data.getNextSentence.display_text.substr(0,data.getNextSentence.display_text.indexOf('#'))}</p>}
                    <input style={{width: `${data.getNextSentence.word_taught.text.length * 25}px`,fontSize: "calc(10px + 2vmin)", margin: "15px 5px 15px 5px"}} value={this.state.userResponse} onChange={e => this.setState({ userResponse: e.target.value })}/>
                    {alreadySeenWord && <p>{data.getNextSentence.display_text.substr(data.getNextSentence.display_text.indexOf('#') + 1,data.getNextSentence.display_text.length)}</p>}
                    </div>
                    <div  style={{clear: "both"}}>
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
                                  console.log(userName,sentenceId,this.checkAnswer(data.getNextSentence.word_taught.text),alreadySeenWord,nextIntervalSentenceId)
                                  if(!this.state.showAnswer){
                                    makeAttempt({variables:{
                                      userName: userName,
                                      sentenceId: sentenceId,
                                      isCorrect: this.checkAnswer(data.getNextSentence.word_taught.text),
                                      alreadySeen: alreadySeenWord,
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
                  </div>
                  <div>
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
                  )} 
              </div>
            ) 
	       }
          else return <div>Complete</div>
         }}
	      </Query>
	      </header>
	    </div>
	  );		

	}
}

export default Play;