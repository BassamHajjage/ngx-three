import { Injectable, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { ThCamera } from '../generated/ThCamera';
import { RaycasterEventDirective } from './raycaster.events.directive';

// eslint-disable-next-line no-shadow
export enum RaycasterEvent {
  mouseEnter = 'mouseEnter',
  mouseExit = 'mouseExit',
  click = 'click'
}

interface NearestIntersection {
  target?: RaycasterEventDirective | null;
  face?: THREE.Face | null;
}

@Injectable()
export class RaycasterService implements OnDestroy {
  private canvas?: HTMLCanvasElement;
  private raycaster = new THREE.Raycaster();
  private selected: RaycasterEventDirective | null = null;
  private enabled = true;
  private camera?: ThCamera;
  private groups: Array<RaycasterEventDirective> = [];
  private paused = false;

  private maxClickDistance = 23;

  private static instanceCnt = 0;

  /**
   * targets of the pointer down event
   */
  private pointerDownEvent?: PointerEvent;

  public readonly nid = RaycasterService.instanceCnt++;

  constructor() {
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
  }

  public ngOnDestroy(): void {
    this.disable();
    this.unsubscribe();
  }

  private subscribe() {
    if (!this.canvas) {
      throw new Error('missing canvas');
    }
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
  }

  private unsubscribe() {
    if (!this.canvas) {
      throw new Error('missing canvas');
    }
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
  }

  public enable() {
    this.enabled = true;
  }

  public disable() {
    this.enabled = false;
  }

  public pause() {
    this.paused = true;
  }

  public resume() {
    this.paused = false;
  }

  get isEnabled() {
    return this.enabled;
  }

  public init(camera: ThCamera, canvas: HTMLCanvasElement) {
    // console.log('Add camera to raycaster', camera);
    this.camera = camera;
    this.canvas = canvas;
    this.subscribe();
  }

  public addEventTarget(target: RaycasterEventDirective) {
    // console.log('RaycasterService.addGroup', group.name, group);
    this.groups.push(target);
  }

  public removeEventTarget(target: RaycasterEventDirective) {
    const index = this.groups.indexOf(target);
    if (index >= 0) {
      this.groups.splice(index, 1);
    }
  }

  private onPointerMove(event: any /*MouseEvent  & { layerX: number, layerY: number}*/) {
    if (!this.isReady()) {
      return;
    }
    const i = this.getFirstIntersectedGroup(event.layerX, event.layerY);
    if (!this.selected || this.selected !== i.target) {
      if (this.selected) {
        this.selected.host.objRef?.dispatchEvent({
          type: RaycasterEvent.mouseExit
        });
        this.selected.onMouseExit();
        this.selected = null;
      }
      if (i && i.target) {
        this.selected = i.target;
        const evt = {
          type: RaycasterEvent.mouseEnter,
          face: i.face
        };
        this.selected.host.objRef?.dispatchEvent(evt);
        this.selected.onMouseEnter(evt);
      }
    }
  }

  private onPointerDown(event: PointerEvent) {
    this.maxClickDistance = event.width;
    this.pointerDownEvent = event;
  }

  private onPointerUp(event: PointerEvent) {
    const downEvent = this.pointerDownEvent;
    this.pointerDownEvent = undefined;

    if (!this.isReady() || this.calcPointerDownUpDinstance(event, downEvent) > this.maxClickDistance) {
      return;
    }
    const i = this.getFirstIntersectedGroup((event as any).layerX, (event as any).layerY);
    if (i && i.target && i.target.host.objRef) {
      const evt = { type: RaycasterEvent.click, face: i.face };
      i.target.host.objRef.dispatchEvent(evt);
      i.target.onClick(evt);
    }
  }

  private isReady(ignorePaused?: boolean): boolean {
    return !!(this.enabled && (ignorePaused || !this.paused) && this.camera && this.camera.objRef && this.groups && this.groups.length > 0);
  }

  private calcPointerDownUpDinstance(upEvent: PointerEvent, downEvent?: PointerEvent) {
    if (!downEvent) {
      return Number.MAX_VALUE;
    }
    const xDist = (upEvent as any).layerX - (downEvent as any).layerX;
    const yDist = (upEvent as any).layerY - (downEvent as any).layerY;
    return Math.sqrt(xDist * xDist + yDist * yDist);
  }

  private getFirstIntersectedGroup(x: number, y: number): NearestIntersection {
    if (!this.camera || !this.canvas || !this.camera.objRef) {
      return { face: null, target: null };
    }
    x = (x / this.canvas.clientWidth) * 2 - 1;
    y = -(y / this.canvas.clientHeight) * 2 + 1;
    const mouseVector = new THREE.Vector2(x, y);
    this.raycaster.setFromCamera(mouseVector, this.camera.objRef);
    let face = null;

    // loop across all groups. Try to find the group with nearest distance.
    let nearestIntersection: THREE.Intersection | undefined;
    let nearestGroup: RaycasterEventDirective | undefined;
    for (const group of this.groups) {
      const i = group.host.objRef;
      if (!i) {
        continue;
      }
      const intersection = this.raycaster.intersectObject(i, true);
      if (intersection.length > 0 && (!nearestIntersection || nearestIntersection.distance > intersection[0].distance)) {
        nearestIntersection = intersection[0];
        face = nearestIntersection.face;
        nearestGroup = group;
      }
    }

    // return the group with nearest distance
    if (nearestGroup) {
      return {
        target: nearestGroup,
        face
      };
    } else {
      return {
        target: null,
        face: null
      };
    }
  }
}
