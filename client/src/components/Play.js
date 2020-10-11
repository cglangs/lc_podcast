import React, { Component } from 'react'
import {Query, Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import { Howl } from 'howler';
import ProgressBar from './ProgressBar'
import Modal from './Modal'
import { getCookie} from '../utils'



const MAKE_ATTEMPT = gql`
  mutation makeAttempt($userId: Int!, $sentenceId: Int!, $isCorrect: Boolean!, $nextIntervalSentenceId: Int) {
	makeClozeAttempt(userId: $userId, sentenceId: $sentenceId, isCorrect: $isCorrect, nextIntervalSentenceId: $nextIntervalSentenceId)
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
      isSubmitted: false,
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

  componentDidMount(){
    if(this.props.user){
      const {user_name, _id ,role} = this.props.user
      this.setUserInfo(user_name, parseInt(_id), role)
    }
  }

  setUserInfo(user_name, userId, role){
    this.setState({user:{user_name, userId, role}})
  }

  /*componentDidUpdate(prevProps){
    console.log(prevProps, this.props)
    if(prevProps.user && this.props.user && this.props.user._id === prevProps.user._id && this.props.user.role === prevProps.user.role){
      //do nothing
      console.log("do nothing")
    }else{
      console.log("update state")
      if(this.props.user){
        const {user_name, _id ,role} = this.props.user
        this.setUserInfo(user_name, parseInt(_id), role)
      }else if(prevProps.user && !this.props.user){
        this.setUserInfo(null,null,null)
      }

    }

  }*/

  showModal = () => {
    this.setState({ showCharacterDefinitions: true });
  };

  hideModal = () => {
    this.setState({ showCharacterDefinitions: false });
  };

	checkAnswer(correct_response) {
		return correct_response === this.state.userResponse
	}

  setAudio(sentenceId) {
    var Sounds
     Sounds = new Howl({
         src: ["/audio/sentences/" + sentenceId + ".m4a"]
      })
  
    return Sounds
  }

  playSound(){
    if(this.state.audio){
        this.state.audio.play()
    }
  }

  getFontColor(){
    var color = 'black'
    if(this.state.isSubmitted){
      color = this.state.isCorrect ? 'green' : 'red'
    }
    return color
  }

  submitAnswer(makeAttempt, refetch, userId, sentenceId, correctResponse, time_fetched, isCorrect, nextIntervalSentenceId){
    if(!this.state.isSubmitted){
      makeAttempt({variables:{
        userId: userId,
        sentenceId: sentenceId,
        isCorrect: isCorrect,
        nextIntervalSentenceId: nextIntervalSentenceId
      }})
    }
     else if(this.state.isSubmitted && this.state.showAnswer){
      this.setState({
          showAnswer: false,
          isSubmitted: false,
          userResponse: '',
          timeFetched: time_fetched,
          showCharacterDefinitions: false,
          audio: null
      }, () => {
        refetch()
      })
    } else{
        this.setState({
        showAnswer: true,
        userResponse: correctResponse,
        isCorrect: true,
        }, () => {this.playSound()})
    }
  }

  getText(text){
    return(
      <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
      <p>{text.english}</p> <i style={{"marginBlockStart": "1em"}}>{text.italics}</i>
      </div>
      )
  }


  playDashboard(userId,role){
    return(
      <Query query={GET_SENTENCE} variables={{userId: userId}}>
          {({ loading, error, data, refetch }) => {
            if (loading) return <div>Fetching</div>
            if (error) return <div>error</div>
            //Don't rerender when waiting for refetch or when there is no result
            if (data.getNextSentence && this.state.timeFetched === data.getNextSentence.time_fetched)  return <div/>
            console.log(data)
            if(data.getNextSentence){
              const sentenceId = parseInt(data.getNextSentence._id)
              var nextIntervalSentenceId = null
              if(userId && data.getNextSentence.next_interval_sentence_id){
                nextIntervalSentenceId = data.getNextSentence.next_interval_sentence_id
              } 
                return(
                  <div style={{width: "50%"}}>
                    {role === "TESTER" && (<p>You are currently not logged in. Log in to save your progress.</p>)}
                    <p>{"Words Learned: " + data.getCurrentProgress.words_learned + "/" + data.getCurrentProgress.total_word_count}</p>
                    <p>{"Cards Completed: " + data.getCurrentProgress.intervals_completed}</p>
                   <ProgressBar bgcolor={"rgb(245 109 109)"} completed={(data.getCurrentProgress.intervals_completed / (data.getCurrentProgress.total_word_count * 7)) * 100}  />
                  <div>
                    {this.state.showAnswer && <button onClick={() => this.playSound(data.getNextSentence._id, data.getNextSentence.word_taught.word_id)}>play</button>}
                    {this.state.showAnswer && data.getNextSentence.word_taught.characters.length > 0 && <button onClick={() => this.setState(prevState => ({showCharacterDefinitions: !prevState.showCharacterDefinitions}))}>Character Definitions</button>}
                    <Modal characters={data.getNextSentence.word_taught.characters} show={this.state.showCharacterDefinitions} handleClose={this.hideModal}/>
                     <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
                     {this.getText(data.getNextSentence)}
                      {this.state.showAnswer && <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}><p>{"|-----------|"}</p> <p>{data.getNextSentence.pinyin}</p></div>}
                      </div>
                     <Mutation mutation={MAKE_ATTEMPT}
                          update={(store) => {
                            if(!this.state.isSubmitted){
                              this.setState({
                              isSubmitted: true,
                              showAnswer: this.checkAnswer(data.getNextSentence.word_taught.text),
                              isCorrect: this.checkAnswer(data.getNextSentence.word_taught.text),
                              audio: this.setAudio(data.getNextSentence._id)
                              }, () => {this.checkAnswer(data.getNextSentence.word_taught.text) && this.playSound()})
                            }

                            }
                          }
                         >
                          {makeAttempt => (
                            <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
                             <p>{data.getNextSentence.display_text.substr(0,data.getNextSentence.display_text.indexOf('#'))}</p>
                            <input style={{width: `${data.getNextSentence.word_taught.text.length * 25}px`,fontSize: "calc(10px + 2vmin)", margin: "15px 5px 15px 5px", color: this.getFontColor()}} value={this.state.userResponse} onChange={e => this.setState({ userResponse: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                this.submitAnswer(makeAttempt, refetch, userId, sentenceId, data.getNextSentence.word_taught.text, data.getNextSentence.time_fetched, this.checkAnswer(data.getNextSentence.word_taught.text), nextIntervalSentenceId)
                              }
                            }}
                            />
                             <p>{data.getNextSentence.display_text.substr(data.getNextSentence.display_text.indexOf('#') + 1,data.getNextSentence.display_text.length)}</p>
                            <button
                              style={{margin: "15px 5px 15px 5px"}}
                              onClick={() => 
                                {
                                  this.submitAnswer(makeAttempt, refetch, userId, sentenceId, data.getNextSentence.word_taught.text, data.getNextSentence.time_fetched, this.checkAnswer(data.getNextSentence.word_taught.text), nextIntervalSentenceId)
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
                    <p style={{fontSize: "12px"}}>{(data.getNextSentence.clean_text !== data.getNextSentence.word_taught.text) && data.getNextSentence.word_taught.english}</p>
                  </div>
                  {this.state.showAnswer && (
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
          else return <div>{!!getCookie('access-token') && (data && data.getCurrentProgress && data.getCurrentProgress.words_learned === 150)  ? "Demo Complete" : !getCookie('access-token') && "Please login to continue"}</div>
         }}
        </Query>
    )

  }

   _confirm = async data => {
    this.props.refetchUser()
  }

	render() {
    console.log(this.state)
	  const {userId, role} = this.state.user
	  return (
	    <div className="App">
	      <header className="App-header">
          {userId ? this.playDashboard(userId, role): 
              <Mutation mutation={CREATE_USER}
                onCompleted={data => this._confirm(data)}
                >
              {createUser => (
              <button onClick={()=> createUser({variables:{user_name: "", email: "", password: "", role: "TESTER"}})}>BEGIN</button>
              )}
            </Mutation>}
	      </header>
	    </div>
	  );		
	}
}





export default Play;