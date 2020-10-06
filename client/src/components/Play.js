import React, { Component } from 'react'
import {Query, Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import {getUserName, getUserId} from '../constants.js'
import { Howl } from 'howler';
import ProgressBar from './ProgressBar'
import { setToken, setRole, setUserName, setUserId } from '../constants'



import '../styles/App.css';


const MAKE_ATTEMPT = gql`
  mutation makeAttempt($userId: Int!, $sentenceId: Int!, $isCorrect: Boolean!, $alreadySeen: Boolean!, $nextIntervalSentenceId: Int) {
	makeClozeAttempt(userId: $userId, sentenceId: $sentenceId, isCorrect: $isCorrect,alreadySeen: $alreadySeen, nextIntervalSentenceId: $nextIntervalSentenceId)
  }

`

const CREATE_USER = gql`
mutation addTemporaryUser($user_name: String!, $email: String!, $password: String!, $role: String!) {
  CreateUser(user_name: $user_name, email: $email, password: $password, role: $role) {
    _id
    user_name
    role
    token
  }
}

`

const GET_SENTENCE = gql`
  query getSentence($userId: Int!) {
	getNextSentence(userId: $userId) {
		_id
    time_fetched
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
  getCurrentProgress(userId: $userId){
    words_learned
    intervals_completed
    total_word_count
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
      lastSentenceId: null,
      audio: null,
      timeFetched: null,
      user:{
        user_name: null,
        userId: null,
        role: null
      }
    }
  }

  componentDidMount() {
    //if user is not logged in create temporary user

  }

	checkAnswer(correct_response) {
		return correct_response === this.state.userResponse
	}

  setAudio(alreadySeen, sentenceId, wordId) {
    var Sounds
    if(alreadySeen){
        Sounds = new Howl({
          src: ["/audio/sentences/" + sentenceId + ".m4a"]
        })
    } else {
        Sounds = new Howl({
          src: ["/audio/words/" + wordId + ".m4a"]
        })
    }
    return Sounds
  }

  playSound(){
    if(this.state.audio){
        this.state.audio.play()
    }
  }

  getFontColor(){
    var color = 'black'
    if(this.state.showAnswer){
      color = this.state.isCorrect ? 'green' : 'grey'
    }
    return color
  }

  submitAnswer(makeAttempt, refetch, userId, sentenceId,time_fetched, isCorrect, alreadySeenWord, nextIntervalSentenceId){
    if(!this.state.showAnswer){
      makeAttempt({variables:{
        userName: userId,
        sentenceId: sentenceId,
        isCorrect: isCorrect,
        alreadySeen: alreadySeenWord,
        nextIntervalSentenceId: nextIntervalSentenceId
      }})
    } else{
      this.setState({
          showAnswer: false,
          userResponse: '',
          timeFetched: time_fetched,
          showCharacterDefinitions: false,
          audio: null
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


  playDashboard(userId,userName){
    return(
      <Query query={GET_SENTENCE} variables={{userId: userId}}>
          {({ loading, error, data, refetch }) => {
            if (loading) return <div>Fetching</div>
            if (error) return <div>error</div>
            //Don't rerender when waiting for refetch
            if (this.state.timeFetched === data.getNextSentence.time_fetched)  return <div/>
            if(data.getNextSentence){
              const sentenceId = parseInt(data.getNextSentence._id)
              const alreadySeenWord = data.getNextSentence.already_seen
              var nextIntervalSentenceId = null
              if(userId && data.getNextSentence.next_interval_sentence_id && alreadySeenWord){
                nextIntervalSentenceId = data.getNextSentence.next_interval_sentence_id
              } 
              /* TESTING purposes only
              else if((data.getNextSentence.next_interval_sentence_id || data.getNextSentence.interval.interval_order < 3) && !alreadySeenWord){
                nextIntervalSentenceId = parseInt(sentenceId)
              }*/
                return(
                  <div style={{width: "50%"}}>
                    {userName === "tester" && (<p>You are currently not logged in. Log in to save your progress.</p>)}
                    <p>{"Words Learned: " + data.getCurrentProgress.words_learned + "/" + data.getCurrentProgress.total_word_count}</p>
                    <p>{"Cards Completed: " + data.getCurrentProgress.intervals_completed}</p>
                   <ProgressBar bgcolor={"rgb(245 109 109)"} completed={(data.getCurrentProgress.intervals_completed / (data.getCurrentProgress.total_word_count * 7)) * 100}  />
                  <div>
                    {this.state.showAnswer && <button onClick={() => this.playSound(alreadySeenWord, data.getNextSentence._id, data.getNextSentence.word_taught.word_id)}>play</button>}
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
                              isCorrect: this.checkAnswer(data.getNextSentence.word_taught.text),
                              audio: this.setAudio(alreadySeenWord, data.getNextSentence._id, data.getNextSentence.word_taught.word_id)
                              }, () => {this.playSound()})
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
                                this.submitAnswer(makeAttempt, refetch, userId, sentenceId, data.getNextSentence.time_fetched, this.checkAnswer(data.getNextSentence.word_taught.text), alreadySeenWord, nextIntervalSentenceId)
                              }
                            }}
                            />
                            {alreadySeenWord && <p>{data.getNextSentence.display_text.substr(data.getNextSentence.display_text.indexOf('#') + 1,data.getNextSentence.display_text.length)}</p>}
                            <button
                              style={{margin: "15px 5px 15px 5px"}}
                              onClick={() => 
                                {
                                  this.submitAnswer(makeAttempt, refetch, userId, sentenceId, data.getNextSentence.time_fetched, this.checkAnswer(data.getNextSentence.word_taught.text), alreadySeenWord, nextIntervalSentenceId)
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
    )

  }

  async _confirm(data)  {
  const { token, user_name, role, _id } = data.CreateUser
  this._saveUserData(token, user_name, role, _id )
}

  _saveUserData(token, user_name, role, userId){
    setToken(token)
    setUserName(user_name)
    setRole(role)
    setUserId(userId)
    this.setState({user:{user_name: user_name, userId: userId, role: role}})
  }

	render() {
	  const userId = parseInt(getUserId())
    const userName = getUserName() 
	  return (
	    <div className="App">
	      <header className="App-header">
          {userId ? this.playDashboard(userId, userName): 
              <Mutation mutation={CREATE_USER}
                onCompleted={data => this._confirm(data)}
                >
              {createUser => (
              <button onClick={()=> createUser({variables:{user_name: "tester", email: "", password: "", role: "TESTER"}})}>BEGIN</button>
              )}
            </Mutation>}
	      </header>
	    </div>
	  );		
	}
}





export default Play;