import React, { Component } from 'react'
import {Query, Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import { Howl } from 'howler';
import ProgressBar from './ProgressBar'
import Switch from "./Switch";
import { getCookie} from '../utils'



const MAKE_ATTEMPT = gql`
  mutation makeAttempt($word_id: Int!, $interval_id: Int!) {
	makeClozeAttempt(word_id: $word_id, interval_id: $interval_id)
  }

`

const CREATE_USER = gql`
mutation addTemporaryUser($user_name: String!, $email: String!, $password: String!, $role: String!) {
  CreateUser(user_name: $user_name, email: $email, password: $password, role: $role) {
    user_id
    user_name
    user_role
  }
}

`

const GET_SENTENCE = gql`
  query getSentence {
	getNextSentence {
		phrase_id
    time_fetched
		raw_text
		display_text
    clean_text
		pinyin
		english
		word_taught{
      word_id
      word_text
			english
      pinyin
      interval_id
		}

	}

  getCurrentProgress {
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
      showPinyin: false,
      showTraditional: false,
      isSubmitted: false,
      showCharacterDefinitions: false,
    	userResponse: '',
      isCorrect: true,
      audio: null,
      timeFetched: null,
      user:{
        user_name: null,
        userId: null,
        role: null
      },
      lastSentence: null

    }
  }

  componentDidMount(){
    if(this.props.user){
      const {user_name, user_id ,user_role} = this.props.user
      this.setUserInfo(user_name, parseInt(user_id), user_role)
    }
  }

  setUserInfo(user_name, userId, role){
    this.setState({user:{user_name, userId, role}})
  }

  componentDidUpdate(prevProps){
    if(prevProps.user && this.props.user && this.props.user._id === prevProps.user._id && this.props.user.role === prevProps.user.role){
      //do nothing
    }else{
      if(this.props.user){
        const {user_name, user_id ,user_role} = this.props.user
        this.setUserInfo(user_name, parseInt(user_id), user_role)
      }else if(prevProps.user && !this.props.user){
        this.setUserInfo(null,null,null)
      }
    }
  }

  showModal = () => {
    this.setState({ showCharacterDefinitions: true });
  };

  hideModal = () => {
    this.setState({ showCharacterDefinitions: false });
  };

	checkAnswer(correct_response) {
		return correct_response.word_text === this.state.userResponse
	}

  setAudio(phrase_id) {
    var Sounds
     Sounds = new Howl({
         src: ["/audio/sentences/" + phrase_id + ".m4a"]
      })
  
    return Sounds
  }

  playSound(){
    if(this.state.audio){
        this.state.audio.play()
    }
  }

  stopSound(){
    if(this.state.audio){
        this.state.audio.stop()
    }

  }

  getFontColor(word){
    var color = 'black'
    if(this.state.isSubmitted){
      color = this.checkAnswer(word) ? 'green' : 'red'
    }
    return color
  }

  submitAnswer(makeAttempt, refetch, userId, wordId, correctResponse, time_fetched, isCorrect, interval_id){
    if(!this.state.isSubmitted){
      makeAttempt({variables:{
        word_id: wordId,
        interval_id: isCorrect ? interval_id + 1 : interval_id
      }})
    }
     else if(this.state.isSubmitted && this.state.showAnswer){
      this.setState({
          showAnswer: false,
          showPinyin: false,
          isSubmitted: false,
          userResponse: '',
          timeFetched: time_fetched,
          showCharacterDefinitions: false,
          lastSentence: null
      }, () => {this.stopSound()})
    } else{
        this.setState({
        showAnswer: true,
        showPinyin: true,
        userResponse: correctResponse,
        }, () => {this.playSound()})
    }
  }

  getText(text){
    return(
      <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
      <p style={{fontSize: "calc(10px + 2vmin)"}}>{text.english}</p> 
      </div>
      )
  }

  getUserInterval(showAnswer, isCorrect, current_interval){
    var progress = current_interval

    if(showAnswer && isCorrect){
      progress = progress + 1
    }
    return progress
  }

  playDashboard(userId,role){
    return(
      <Query query={GET_SENTENCE} variables={{userId: userId}}>
          {({ loading, error, data, refetch }) => {
            if (loading) return <div style={{"marginTop": "25%",marginLeft: "45%"}}>Loading</div>
            if (error) return <div style={{"marginTop": "25%",marginLeft: "45%"}}>error</div>
            const nextSentence = this.state.lastSentence ||data.getNextSentence
            //Don't rerender when waiting for refetch or when there is no result
            if (nextSentence && this.state.timeFetched === nextSentence.time_fetched)  return <div/>
            if(data.getNextSentence && data.getCurrentProgress){
              const wordId = parseInt(nextSentence.word_taught.word_id)
              const userInterval = this.getUserInterval(this.state.showAnswer,this.state.isCorrect, nextSentence.word_taught.interval_id)
                return(
                  <div style={{display: "flex", flexDirection: "row", "width": "100%"}}>
                  <div style={{"flexGrow": "4", "paddingTop": "20%"}}>
                  {role === "TESTER" && (<p style={{fontSize: "12px", "marginBottom": "20px"}}>You are currently not logged in. Log in to save your progress.</p>)}
                  <div style={{display: "inline-block", "textAlign": "center"}}>
                    <ProgressBar currentTimeInterval={userInterval} />
                     <div style={{display: "flex", justifyContent: "center"}}>
                      {this.state.showAnswer && <button  style={{"width": "25px", "height": "25px", "marginRight": "10px", "marginBlockStart": "1.8em"}} onClick={() => this.playSound(nextSentence._id, nextSentence.word_taught.word_id)}><img style={{"width": "100%"}} alt="replay audio" src="speaker_icon.svg"/></button>}
                     {this.state.showPinyin ? <p style={{fontSize: "calc(10px + 2vmin)"}}>{nextSentence.pinyin}</p> : this.getText(nextSentence)}
                      </div>
                     <Mutation mutation={MAKE_ATTEMPT} refetchQueries={[{query: GET_SENTENCE, variables: {userId: userId}}]}
                          update={(store) => {
                            if(!this.state.isSubmitted){
                              this.setState({
                              isSubmitted: true,
                              showAnswer: this.checkAnswer(nextSentence.word_taught),
                              showPinyin: this.checkAnswer(nextSentence.word_taught),
                              isCorrect: this.checkAnswer(nextSentence.word_taught),
                              audio: this.setAudio(nextSentence.phrase_id),
                              lastSentence: nextSentence
                              }, () => {
                                if(this.checkAnswer(nextSentence.word_taught)){
                                  this.playSound()
                                }
                              })
                            }

                            }
                          }
                         >
                          {makeAttempt => (
                            <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
                             <p className="cloze-text">{nextSentence.display_text.substr(0,nextSentence.display_text.indexOf('#'))}</p>
                            <input style={{width: `${nextSentence.word_taught.word_text.length * 40}px`,fontSize: "37px", margin: "15px 5px 15px 5px", color: this.getFontColor(nextSentence.word_taught), height: "40px", "marginBlockStart": "1em"}} value={this.state.userResponse} onChange={e => this.setState({ userResponse: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                this.submitAnswer(makeAttempt, refetch, userId, wordId, (nextSentence.word_taught.word_text), nextSentence.time_fetched, this.checkAnswer(nextSentence.word_taught), nextSentence.word_taught.interval_id)
                              }
                            }}
                            />
                             <p className="cloze-text">{nextSentence.display_text.substr(nextSentence.display_text.indexOf('#') + 1,nextSentence.display_text.length)}</p>
                            <button
                              style={{margin: "15px 5px 15px 5px", height: "40px", marginBlockStart: "3em", fontSize: "14px"}}
                              onClick={() => 
                                {
                                  this.submitAnswer(makeAttempt, refetch, userId, wordId, (nextSentence.word_taught.word_text), nextSentence.time_fetched, this.checkAnswer(nextSentence.word_taught), nextSentence.word_taught.interval_id)
                                }
                              }
                            >
                            {!this.state.isSubmitted ? "Submit Answer" : (this.state.showAnswer ? "Next Phrase" : "Show Answer")}
                            </button>
                            </div>
                          )}
                    </Mutation>
                  </div>
                  <div>
                    {(nextSentence.clean_text !== nextSentence.word_taught.word_text) && (this.state.showPinyin ? <p>{nextSentence.word_taught.pinyin}</p> : this.getText(nextSentence.word_taught))}
                  </div>
              </div>
              <div style={{"flexGrow": 1, "backgroundColor": "lightslategray"}}>
                 <div style={{display: "flex", flexDirection: "column", justifyContent: "right"}}>
                      <p style={{fontSize: "14px"}}>{"Words Learned: " + data.getCurrentProgress.words_learned + "/" + data.getCurrentProgress.total_word_count}</p>
                      <p style={{fontSize: "14px"}}>{"Cards Completed: " + data.getCurrentProgress.intervals_completed}</p>
                      {/*<div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
                        <p style={{fontSize: "14px", "marginBlockStart": "0.5em"}}>{"Simplified"}</p> 
                        <Switch switchId={`simplified-traditional-switch`} isDisabled={false} isOn={this.state.showTraditional} handleToggle={() => this.setState(prevState => ({showTraditional: !prevState.showTraditional}))} />
                        <p style={{fontSize: "14px", "marginBlockStart": "0.5em", "marginLeft": "5%"}}>{"Traditional"}</p> 
                      </div>*/}
                      <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center", "marginTop": "20px"}}>
                        <p style={{fontSize: "14px", "marginBlockStart": "0.5em"}}>{"English"}</p> 
                        <Switch switchId={`english-pinyin-switch`} isDisabled={!this.state.showAnswer} isOn={this.state.showPinyin} handleToggle={() => this.setState(prevState => ({showPinyin: !prevState.showPinyin}))} />
                        <p style={{fontSize: "14px", "marginBlockStart": "0.5em", "marginLeft": "5%"}}>{"Pinyin"}</p> 
                      </div>
                </div>
              </div>
              </div>
            ) 
         }
          else return <div style={{display: "flex", justifyContent: "center", "width": "100%", "marginTop": "25%"}}>{!!getCookie('access-token') && (data && data.getCurrentProgress && data.getCurrentProgress.words_learned === 150)  ? (<p>{"Demo Complete"}</p>) : !getCookie('access-token') && (<p>{"Please login to continue"}</p>)}</div>
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
	      <header className="App-header-play">
          {userId !==null && typeof userId !== 'undefined' ? this.playDashboard(userId, role): 
              <Mutation mutation={CREATE_USER}
                onCompleted={data => this._confirm(data)}
                >
              {createUser => (
              <div style={{"marginTop": "25%",marginLeft: "30%"}}>
              <p>Remember to set your keyboard's language to Chinese</p>
              <button onClick={()=> createUser({variables:{user_name: "", email: "", password: "", role: "TESTER"}})}>Start Learning</button>
              </div>
              )}
            </Mutation>}
	      </header>
          <footer>
            <span><b>Contact:</b> <a href="mailto:clozechinese@gmail.com">clozechinese@gmail.com</a></span> 
          </footer>
	    </div>
	  );		
	}
}





export default Play;