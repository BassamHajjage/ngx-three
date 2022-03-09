import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { EditorService } from './EditorService';

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CodeComponent {
  public fileNames: string[] = [];

  protected _exampleClassName?: string;

  constructor(public readonly editorService: EditorService) {}

  @Input()
  public set codeUrls(urls: string[]) {
    this.editorService.setUrls(urls);
    this.fileNames = this.editorService.fileNames;
  }

  public get codeUrls() {
    return this.editorService.urls;
  }

  @Input()
  public set exampleClassName(classname: string) {
    this._exampleClassName = classname;
    this.editorService.setExampleClassName(classname);
  }

  @Input() lineNumbers = false;
}
