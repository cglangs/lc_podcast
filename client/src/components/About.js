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
		This app is a prototype of what I would like to create in the near future. It works by starting from zero and progressively introducing words to the user which are then used in fill-in-the-blanks exercises. I have written the phrases myself (even though I don’t know very much Chinese), and I have only included the 150 words from HSK1.
        </p>
        <p><b>Goals:</b></p>
		<ul>
		  <li>Find a native Chinese speaker (preferably with teaching experience) who would like to partner with me on this project </li>
		  <li>Get as much feedback as possible on the app: What don’t you like about it? What could be better?</li>
		  <li>Find a better method for creating audio</li>
		</ul>
		<p><b>Contact me:</b></p>
		<p>fakeemail@jmail.com</p>
		<p>Please email me if you have any feedback or if you could get me in touch with a potential collaborator. I would be happy to chat with you!</p>
        </header>
      </div>
    )
  }

}

export default About