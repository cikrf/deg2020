import { Directive, Output, Input, EventEmitter, HostBinding, HostListener } from '@angular/core';

@Directive({
  selector: '[appDragDrop]'
})
export class DragDropDirective {

  @Output() FileDropped = new EventEmitter<any>();

  @HostBinding('style.background-color') background = '#FFFFFF';
  @HostBinding('style.opacity') opacity = '1';

  //Dragover listener
  @HostListener('dragover', ['$event']) onDragOver(evt: any): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#9ecbec';
    this.opacity = '0.8';
  }

  //Dragleave listener
  @HostListener('dragleave', ['$event'])
  public onDragLeave(evt: any): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#f5fcff';
    this.opacity = '1';
  }

  //Drop listener
  @HostListener('drop', ['$event'])
  public ondrop(evt: any): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#FFFFFF';
    this.opacity = '1';
    if (evt.dataTransfer.files.length > 0) {
      this.FileDropped.emit(evt.dataTransfer);
    }
  }

}
