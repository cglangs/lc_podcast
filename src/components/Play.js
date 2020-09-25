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
    clean_text
		pinyin
		english
    italics
    interval{
      interval_order
    }
    current_users{
      user_name
    }
    already_seen
		word_taught{
      word_id
			text
			english
      pinyin
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
      showCharacterDefinitions: false,
    	userResponse: '',
      isCorrect: true,
      lastSentenceId: null 
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

  getFontColor(){
    var color = 'black'
    if(this.state.showAnswer){
      color = this.state.isCorrect ? 'green' : 'grey'
    }
    return color
  }

  submitAnswer(makeAttempt, refetch, userName, sentenceId, isCorrect, alreadySeenWord, nextIntervalSentenceId ){
    if(!this.state.showAnswer){
      makeAttempt({variables:{
        userName: userName,
        sentenceId: sentenceId,
        isCorrect: isCorrect,
        alreadySeen: alreadySeenWord,
        nextIntervalSentenceId: nextIntervalSentenceId
      }})
    } else{
      this.setState({
          showAnswer: false,
          userResponse: '',
          lastSentenceId: sentenceId.toString()
      }, () => {
        refetch()
      })
    }
  }

  getText(text){
    return(
      <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
      <p>{text.english}</p> <i style={{"marginBlockStart": "1em"}}>{text.italics}</i>
      </div>
      )
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
            if (this.state.lastSentenceId === data.getNextSentence._id) return <div/>
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
                    {/*<button onClick={this.SoundPlay}>play</button>*/}
                    {this.state.showAnswer && data.getNextSentence.word_taught.characters.length > 0 && <button onClick={() => this.setState(prevState => ({showCharacterDefinitions: !prevState.showCharacterDefinitions}))}>Character Definitions</button>}
                    {this.state.showCharacterDefinitions && 
                       data.getNextSentence.word_taught.characters.map(char => 
                            <div>
                            <p>{char.text}</p>
                            <p>{char.english}</p>
                            </div>
                    )}
                     <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
                     {alreadySeenWord ? this.getText(data.getNextSentence) : this.getText(data.getNextSentence.word_taught)}
                      {this.state.showAnswer && <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}><p>{"|-----------|"}</p> <p>{alreadySeenWord ? data.getNextSentence.pinyin : data.getNextSentence.word_taught.pinyin}</p></div>}
                      </div>
                     <Mutation mutation={MAKE_ATTEMPT}
                          update={(store) => {
                            if(!this.state.showAnswer){
                              this.setState({
                              showAnswer: true,
                              showCharacterDefinitions: false,
                              userResponse: data.getNextSentence.word_taught.text,
                              isCorrect: this.checkAnswer(data.getNextSentence.word_taught.text)
                              })
                            }

                            }
                          }
                         >
                          {makeAttempt => (
                            <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
                            {alreadySeenWord && <p>{data.getNextSentence.display_text.substr(0,data.getNextSentence.display_text.indexOf('#'))}</p>}
                            <input style={{width: `${data.getNextSentence.word_taught.text.length * 25}px`,fontSize: "calc(10px + 2vmin)", margin: "15px 5px 15px 5px", color: this.getFontColor()}} value={this.state.userResponse} onChange={e => this.setState({ userResponse: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                this.submitAnswer(makeAttempt, refetch,userName, sentenceId, this.checkAnswer(data.getNextSentence.word_taught.text), alreadySeenWord, nextIntervalSentenceId)
                              }
                            }}
                            />
                            {alreadySeenWord && <p>{data.getNextSentence.display_text.substr(data.getNextSentence.display_text.indexOf('#') + 1,data.getNextSentence.display_text.length)}</p>}
                            <button
                              style={{margin: "15px 5px 15px 5px"}}
                              onClick={() => 
                                {
                                  this.submitAnswer(makeAttempt, refetch,userName, sentenceId, this.checkAnswer(data.getNextSentence.word_taught.text), alreadySeenWord, nextIntervalSentenceId)
                                }
                              }
                            >
                            {this.state.showAnswer ? ">" : ">"}
                            </button>
                            </div>
                          )}
                    </Mutation>
                  </div>
                  <div>
                    <p style={{fontSize: "12px"}}>{alreadySeenWord && (data.getNextSentence.clean_text !== data.getNextSentence.word_taught.text) && data.getNextSentence.word_taught.english}</p>
                  </div>
                  {this.state.showAnswer && alreadySeenWord && (
                      <div>
                        <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
                        <p>{data.getNextSentence.word_taught.text}</p>
                        <p style={{marginLeft: "5px"}}>{data.getNextSentence.word_taught.pinyin}</p>
                        </div>
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