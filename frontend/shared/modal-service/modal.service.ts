import { ApplicationRef, ComponentFactoryResolver, EmbeddedViewRef, Injectable, Injector } from '@angular/core';
import { IconInterface } from '../../projects/elections/src/app/utils/interfaces/icon.interface';
import { Observable, Subject } from 'rxjs';

const XMLNS = 'http://www.w3.org/2000/svg';

@Injectable()
export class ModalService {

  private childComponentRef: any;
  private componentElement: any;
  private confirm = new Subject<any>();
  private closeAction = (): void => {};

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector,
  ) {
    if (!(typeof window === 'undefined')) {
      window.addEventListener('click', (e: any) => {
        if (!!this.componentElement && (e.target.classList.contains('modal_close'))) {
          this.close();
        }
      });
    //   window.addEventListener('keydown', (e: any) => {
    //     if (e.key === 'Escape' && !!this.componentElement) {
    //       this.close();
    //     }
    //   });
    }
  }

  private attachConfig(config: ChildConfigInterface, componentRef: any): void {
    // tslint:disable-next-line:forin
    for (const key in config?.inputs) {
      componentRef.instance[key] = config.inputs[key];
    }
    // tslint:disable-next-line:forin
    for (const key in config?.outputs) {
      componentRef.instance[key] = config.outputs[key];
    }
  }

  open(content: any, options?: ModalOptions): any {
    this.closeAction = (): void => {};
    this.close();
    if (content instanceof ModalContent) {
      this.closeAction = content.buttonCancelAction || this.closeAction;
      return this.createModalContent(content);
    }
    this.closeAction = options?.closeAction || this.closeAction;
    if (!options?.bodyScroll) {
      document.body.style.overflow = 'hidden';
    }
    return this.createModalContent(content, options);
  }

  openConfirm(
    title: string, text: string, okButtonText: string, cancelButtonText: string,
  ): Observable<any> {
    const confirm = new ModalContent(
      title,
      text,
      null,
      okButtonText,
      (): void => {
        this.closeAction = (): void => {};
        this.confirm.next(true);
      },
      cancelButtonText,
      (): void => {
        this.confirm.next(false);
      },
    );
    this.open(confirm);
    return this.confirm.asObservable();
  }

  close(): void {
    this.closeAction();
    if (!!this.componentElement) {
      this.componentElement.remove();
      this.componentElement = null;
    }
    if (!!this.childComponentRef) {
      this.componentElement = null;
    }
    document.body.style.overflow = null;
  }

  private createModalContent(content: any, options?: ModalOptions): void {
    let componentElement;
    let clearStyles = false;
    if (content instanceof ModalContent) {
      componentElement = this.getModalContentElement(content);
    } else {
      clearStyles = true;
      const childComponentRef = this.componentFactoryResolver
        .resolveComponentFactory(content)
        .create(this.injector);
      this.attachConfig(options, childComponentRef);
      this.childComponentRef = childComponentRef;
      this.appRef.attachView(childComponentRef.hostView);
      componentElement = (childComponentRef.hostView as EmbeddedViewRef<any>)
        .rootNodes[0] as HTMLElement;
    }
    this.componentElement = this.wrapComponent(componentElement, clearStyles, options);
    document.querySelector('body').appendChild(this.componentElement);
    this.componentElement.scrollIntoView();
  }

  private wrapComponent(content: HTMLElement, clearStyles: boolean = false, options: ModalOptions = {}): any {
    // div modal outer
    const divModal = document.createElement('div');
    divModal.classList.add('modal');
    if (clearStyles) {
      divModal.classList.add('modal--clear-styles');
    }
    if (options.mobileSticked) {
      divModal.classList.add('screen-fixed');
    }
    if (options.stylesCustom) {
      divModal.classList.add('styles-custom');
    }
    // div block main
    const divModalBlock = document.createElement('div');
    divModalBlock.classList.add('modal__block');
    if (!!options.width) {
      divModalBlock.style.width = options.width;
    }
    if (!!options.height) {
      divModalBlock.style.height = options.height;
    }
    divModal.appendChild(divModalBlock);
    // button close
    if (options.closeCross !== false) {
      const buttonClose = document.createElement('button');
      buttonClose.classList.add('modal__close', 'modal_close');
      divModalBlock.appendChild(buttonClose);
      // svg
      const svgClose = document.createElementNS(XMLNS, 'svg');
      svgClose.classList.add('modal_close__img');
      svgClose.setAttribute('viewBox', '0 0 14 14');
      svgClose.setAttribute('fill', 'none');
      buttonClose.appendChild(svgClose);
      // svg path
      const svgPath = document.createElementNS(XMLNS, 'path');
      svgPath.setAttribute('d', 'M1 13L13 1M1 1L13 13');
      svgPath.setAttribute('stroke', '#B0B8C0');
      svgPath.setAttribute('stroke-width', '2');
      svgClose.appendChild(svgPath);
    }
    // div content
    const divContent = document.createElement('div');
    divContent.classList.add('modal__content');
    if (!clearStyles) {
      divContent.classList.add('modal__content--center');
    }
    divModalBlock.appendChild(divContent);
    // append component content
    divContent.appendChild(content);

    return divModal;
  }

  private getModalContentElement(content: ModalContent): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('modal_content');
    if (!!content.icon) {
      // icon div wrapper
      const divIconWrapper = document.createElement('div');
      div.appendChild(divIconWrapper);
      // icon
      const icon = document.createElement('div');
      icon.classList.add('modal_content__icon', 'icon', `icon--${content.icon.size}`, `icon-${content.icon.name}`);
      divIconWrapper.appendChild(icon);
    }
    if (!!content.title) {
      // title
      const title = document.createElement('div');
      title.classList.add('modal_content__title', 'text-h2');
      title.innerText = content.title;
      div.appendChild(title);
    }
    if (!!content.text) {
      // text
      const text = document.createElement('div');
      text.classList.add('modal_content__text', 'text-body');
      text.innerText = content.text;
      div.appendChild(text);
    }
    if (!!content.buttonOk || !!content.buttonCancel) {
      // buttons div
      const buttons = document.createElement('div');
      buttons.classList.add('modal_content__buttons');
      div.appendChild(buttons);
      if (!!content.buttonCancel) {
        // button cancel
        const buttonCancel = document.createElement('div');
        buttonCancel.classList.add('modal_content__button', 'button');
        buttonCancel.innerText = content.buttonCancel;
        buttonCancel.onclick = (): void => {
          this.close();
        };
        buttons.appendChild(buttonCancel);
      }
      if (!!content.buttonOk) {
        // button ok
        const buttonOk = document.createElement('div');
        buttonOk.classList.add('modal_content__button', 'button', 'button-blue');
        buttonOk.innerText = content.buttonOk;
        if (!!content.buttonOkAction) {
          buttonOk.onclick = (): void => {
            content.buttonOkAction();
            this.close();
          };
        }
        buttons.appendChild(buttonOk);
      }
    }

    return div;
  }

}

interface ChildConfigInterface {
  inputs?: object;
  outputs?: object;
}

export class ModalContent {
  title?: string;
  text?: string;
  icon?: IconInterface;
  buttonOk?: string;
  buttonOkAction?: () => any;
  buttonCancel?: string;
  buttonCancelAction?: () => any;

  constructor(
    title?: string,
    text?: string,
    icon?: IconInterface,
    buttonOk?: string,
    buttonOkAction?: () => any,
    buttonCancel?: string,
    buttonCancelAction?: () => any,
  ) {
    this.title = title;
    this.text = text;
    this.icon = icon;
    this.buttonOk = buttonOk;
    this.buttonOkAction = buttonOkAction;
    this.buttonCancel = buttonCancel;
    this.buttonCancelAction = buttonCancelAction;
  }
}

export interface ModalOptions {
  inputs?: any;
  outputs?: any;
  width?: any;
  height?: any;
  closeAction?: () => any;
  mobileSticked?: boolean;
  closeCross?: boolean;
  bodyScroll?: boolean;
  stylesCustom?: boolean;
}
