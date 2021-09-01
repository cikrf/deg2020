import { Component, OnInit } from '@angular/core';
import { QuestionAnswer } from './question-answer';
import { QUESTIONANSWER } from './mock-question-answer';

@Component({
  selector: 'app-question-answer',
  templateUrl: './question-answer.component.html',
  styleUrls: ['./question-answer.component.scss']
})
export class QuestionAnswerComponent implements OnInit {
  questionAnswers = QUESTIONANSWER;
  toggle: QuestionAnswer;

  constructor() { }

  ngOnInit(): void {
  }

  toogleClass(questionAnswer: QuestionAnswer): void {
    if (questionAnswer === this.toggle) {
      this.toggle = undefined;
      return;
    }
    this.toggle = questionAnswer;
  }
}
