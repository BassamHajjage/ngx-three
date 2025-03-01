/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @angular-eslint/component-selector, @angular-eslint/component-class-suffix, jsdoc/no-types, import/no-deprecated */
import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  Input,
  Type,
} from '@angular/core';
import {
  Color,
  ColorRepresentation,
  Event,
  FogBase,
  Material,
  Scene,
  Texture,
} from 'three';
import { applyValue } from '../util';
import { ThObject3D } from './ThObject3D';

@Component({
  selector: 'th-scene',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: ThObject3D, useExisting: forwardRef(() => ThScene) }],
})
export class ThScene<T extends Scene = Scene, TARGS = []> extends ThObject3D<
  Event,
  T,
  TARGS
> {
  public getType(): Type<Scene> {
    return Scene;
  }

  @Input()
  public set type(value: 'Scene') {
    if (this._objRef) {
      this._objRef.type = value;
    }
  }

  @Input()
  public set fog(value: FogBase | null) {
    if (this._objRef) {
      this._objRef.fog = value;
    }
  }

  @Input()
  public set overrideMaterial(value: Material | null) {
    if (this._objRef) {
      this._objRef.overrideMaterial = value;
    }
  }

  @Input()
  public set autoUpdate(value: boolean) {
    if (this._objRef) {
      this._objRef.autoUpdate = value;
    }
  }

  @Input()
  public set background(
    value: null | Color | Texture | [color: ColorRepresentation]
  ) {
    if (this._objRef) {
      this._objRef.background = applyValue<null | Color | Texture>(
        this._objRef.background,
        value
      );
    }
  }
  @Input()
  public set environment(value: null | Texture) {
    if (this._objRef) {
      this._objRef.environment = value;
    }
  }
}
