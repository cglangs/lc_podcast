import React, { Component } from 'react'
import {Query, Mutation} from 'react-apollo';
import gql from 'graphql-tag';
import { Howl } from 'howler';
import ProgressBar from './ProgressBar'
import Modal from './Modal'
import { getCookie} from '../utils'



const MAKE_ATTEMPT = gql`
  mutation makeAttempt($userId: Int!, $sentenceId: Int!, $isCorrect: Boolean!) {
	makeClozeAttempt(userId: $userId, sentenceId: $sentenceId, isCorrect: $isCorrect)
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
      const {user_name, _id ,role} = this.props.user
      this.setUserInfo(user_name, parseInt(_id), role)
    }
  }

  setUserInfo(user_name, userId, role){
    this.setState({user:{user_name, userId, role}})
  }

  componentDidUpdate(prevProps){
    console.log(prevProps, this.props.user)
    if(prevProps.user && this.props.user && this.props.user._id === prevProps.user._id && this.props.user.role === prevProps.user.role){
      //do nothing
    }else{
      if(this.props.user){
        const {user_name, _id ,role} = this.props.user
        this.setUserInfo(user_name, parseInt(_id), role)
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
		return correct_response === this.state.userResponse
	}

  setAudio(interval, word_id) {
    var Sounds
     Sounds = new Howl({
         src: ["/audio/sentences/" + interval + "-" + word_id + ".m4a"]
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

  submitAnswer(makeAttempt, refetch, userId, sentenceId, correctResponse, time_fetched, isCorrect){
    if(!this.state.isSubmitted){
      makeAttempt({variables:{
        userId: userId,
        sentenceId: sentenceId,
        isCorrect: isCorrect
      }})
    }
     else if(this.state.isSubmitted && this.state.showAnswer){
      this.setState({
          showAnswer: false,
          isSubmitted: false,
          userResponse: '',
          timeFetched: time_fetched,
          showCharacterDefinitions: false,
          audio: null,
          lastSentence: null
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
      <p style={{fontSize: "16px"}}>{text.english}</p> <i style={{"marginBlockStart": "1em", fontSize: "16px"}}>{text.italics}</i>
      </div>
      )
  }


  playDashboard(userId,role){
    return(
      <Query query={GET_SENTENCE} variables={{userId: userId}}>
          {({ loading, error, data, refetch }) => {
            if (loading) return <div style={{"marginTop": "30%"}}>Fetching</div>
            if (error) return <div style={{"marginTop": "30%"}}>error</div>
            const nextSentence = this.state.lastSentence ||data.getNextSentence
            //Don't rerender when waiting for refetch or when there is no result
            if (nextSentence && this.state.timeFetched === nextSentence.time_fetched)  return <div/>
            if(nextSentence){
              const sentenceId = parseInt(nextSentence._id)
                return(
                  <div style={{width: "50%"}}>
                  {role === "TESTER" && (<p style={{fontSize: "12px", "marginBottom": "20px"}}>You are currently not logged in. Log in to save your progress.</p>)}
                    <div style={{width: "30%", "marginBottom": "100px", display: "inline-block"}}>
                      <p style={{fontSize: "14px"}}>{"Words Learned: " + data.getCurrentProgress.words_learned + "/" + data.getCurrentProgress.total_word_count}</p>
                      <p style={{fontSize: "14px"}}>{"Cards Completed: " + data.getCurrentProgress.intervals_completed}</p>
                     <ProgressBar bgcolor={"rgb(245 109 109)"} completed={(data.getCurrentProgress.intervals_completed / (data.getCurrentProgress.total_word_count * 7)) * 100}  />
                    </div>
                  <div>
                    {this.state.showAnswer && <button onClick={() => this.playSound(nextSentence._id, nextSentence.word_taught.word_id)}>replay audio</button>}
                    <Modal characters={nextSentence.word_taught.characters} show={this.state.showCharacterDefinitions} handleClose={this.hideModal}/>
                     <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                     {this.state.showAnswer && <p style={{fontSize: "16px"}}>{nextSentence.pinyin}</p>}
                     {this.getText(nextSentence)}
                      </div>
                     <Mutation mutation={MAKE_ATTEMPT} refetchQueries={[{query: GET_SENTENCE, variables: {userId: userId}}]}
                          update={(store) => {
                            if(!this.state.isSubmitted){
                              this.setState({
                              isSubmitted: true,
                              showAnswer: this.checkAnswer(nextSentence.word_taught.text),
                              isCorrect: this.checkAnswer(nextSentence.word_taught.text),
                              audio: this.setAudio(nextSentence.interval.interval_order, nextSentence.word_taught.word_id),
                              lastSentence: nextSentence
                              }, () => {
                                if(this.checkAnswer(nextSentence.word_taught.text)){
                                  this.playSound()
                                }
                              })
                            }

                            }
                          }
                         >
                          {makeAttempt => (
                            <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
                             <p>{nextSentence.display_text.substr(0,nextSentence.display_text.indexOf('#'))}</p>
                            <input style={{width: `${nextSentence.word_taught.text.length * 25}px`,fontSize: "calc(10px + 2vmin)", margin: "15px 5px 15px 5px", color: this.getFontColor()}} value={this.state.userResponse} onChange={e => this.setState({ userResponse: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                this.submitAnswer(makeAttempt, refetch, userId, sentenceId, nextSentence.word_taught.text, nextSentence.time_fetched, this.checkAnswer(nextSentence.word_taught.text))
                              }
                            }}
                            />
                             <p>{nextSentence.display_text.substr(nextSentence.display_text.indexOf('#') + 1,nextSentence.display_text.length)}</p>
                            <button
                              style={{margin: "15px 5px 15px 5px"}}
                              onClick={() => 
                                {
                                  this.submitAnswer(makeAttempt, refetch, userId, sentenceId, nextSentence.word_taught.text, nextSentence.time_fetched, this.checkAnswer(nextSentence.word_taught.text))
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
                    <p style={{fontSize: "24px"}}>{(nextSentence.clean_text !== nextSentence.word_taught.text) && nextSentence.word_taught.english}</p>
                  </div>
                  {this.state.showAnswer && nextSentence.word_taught.characters.length > 0 && <button onClick={() => this.setState(prevState => ({showCharacterDefinitions: !prevState.showCharacterDefinitions}))}>Character Definitions</button>}
                  {(this.state.showAnswer &&  nextSentence.word_taught !==  nextSentence.word_taught.text) && (
                      <div>
                        <div style={{display: "flex", flexDirectioion: "row", justifyContent: "center"}}>
                        <p>{nextSentence.word_taught.text}</p>
                        <p style={{marginLeft: "5px"}}>{nextSentence.word_taught.pinyin}</p>
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
	  const {userId, role} = this.state.user
    console.log(userId, role)
	  return (
	    <div className="App">
	      <header className="App-header">
          {userId !==null && typeof userId !== 'undefined' ? this.playDashboard(userId, role): 
              <Mutation mutation={CREATE_USER}
                onCompleted={data => this._confirm(data)}
                >
              {createUser => (
              <button style={{"marginTop": "30%"}} onClick={()=> createUser({variables:{user_name: "", email: "", password: "", role: "TESTER"}})}>BEGIN</button>
              )}
            </Mutation>}
	      </header>
	    </div>
	  );		
	}
}





export default Play;