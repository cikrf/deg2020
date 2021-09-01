import {
  ApplicationRef,
  ComponentFactoryResolver,
  EmbeddedViewRef,
  Injectable,
  Injector,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { NglToast } from 'ng-lightning';

const DURATION = 20000;

@Injectable()
export class NotificationsService {
  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
    private appRef: ApplicationRef,
  ) {
  }

  @ViewChild('container', {read: ViewContainerRef}) container: ViewContainerRef;

  create(variant: NotificationType, text: string, duration: number = DURATION): void {

    const contentNode = document.createElement('h2');
    contentNode.classList.add('slds-text-heading_small');
    contentNode.innerText = text;

    const componentRef = this.componentFactoryResolver
      .resolveComponentFactory(NglToast)
      .create(this.injector, [[contentNode]]);
    const dismissible = true;
    this.attachInputs({
      variant,
      dismissible,
      duration
    }, componentRef);

    this.appRef.attachView(componentRef.hostView);
    const componentElement = (componentRef.hostView as EmbeddedViewRef<any>)
      .rootNodes[0] as HTMLElement;
    const componentWrapper = document.createElement('div');
    componentWrapper.appendChild(componentElement);

    document.querySelector('.notifications')?.appendChild(componentWrapper);
    const emitter = componentRef.instance.closeEventEmitter.subscribe(() => {
      emitter.unsubscribe();
      componentWrapper.remove();
      componentRef.destroy();
    });
  }

  private attachInputs(inputs: any, componentRef: any): void {
    // tslint:disable-next-line:forin
    for (const key in inputs) {
      componentRef.instance[key] = inputs[key];
    }
  }
}

export enum NotificationType {
  ERROR = 'error',
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
}
