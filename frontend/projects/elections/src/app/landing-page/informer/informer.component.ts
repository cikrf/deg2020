import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-informer',
  templateUrl: './informer.component.html',
  styleUrls: ['./informer.component.scss']
})
export class InformerComponent implements OnInit {
  @Input() title: string;
  @Input() subTitle: string;
  @Input() button: string;
  @Input() link: string;
  @Input() disabled = false;

  constructor() { }

  ngOnInit(): void {
  }

}
