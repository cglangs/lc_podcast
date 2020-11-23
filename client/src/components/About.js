import React, { Component } from 'react'




class About extends Component {

  render() {
    return(
      <div className="App">
        <header className="App-header-about">
        <p><b>Me:</b></p>
        <p>
        My name is Cory and I am learning Mandarin Chinese. I’m a big fan of fill-in-the-blanks (cloze) flashcards and have used them to learn other languages, but I couldn’t find any such apps for Chinese that appealed to me. I decided to make my own.
        </p>
        <p><b>This App:</b></p>
        <p>
		This app uses over 5000 mined sentences, spaced repetition, and progressively adds (over 7000) new words. All the words you will see in the sentences around the blank space are either words that you've seen before or HSK 1 words.
        </p>
		<span><p><b>Contact me:</b></p> <a href="mailto:clozechinese@gmail.com" style={{"color":"aquamarine"}}>clozechinese@gmail.com</a></span> 
		<p>Please email me if you have any feedback or if you could get me in touch with a potential collaborator. I would be happy to chat with you!</p>
        </header>
      </div>
    )
  }

}

export default About