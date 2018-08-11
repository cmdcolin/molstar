/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { Structure } from 'mol-model/structure';
import { Visual } from '..';
import { MeshRenderObject } from 'mol-gl/render-object';
import { Mesh } from '../../shape/mesh';
import { RuntimeContext } from 'mol-task';
import { LocationIterator } from './visual/util/location-iterator';
import { createComplexMeshRenderObject, createColors } from './visual/util/common';
import { StructureMeshProps, StructureProps } from '.';
import { deepEqual } from 'mol-util';
import { updateMeshValues, updateRenderableState } from '../util';
import { PickingId } from '../../util/picking';
import { Loci } from 'mol-model/loci';
import { MarkerAction, MarkerData } from '../../util/marker-data';

export interface  ComplexVisual<P extends StructureProps> extends Visual<Structure, P> { }

export interface ComplexMeshVisualBuilder<P extends StructureMeshProps> {
    defaultProps: P
    createMesh(ctx: RuntimeContext, structure: Structure, props: P, mesh?: Mesh): Promise<Mesh>
    createLocationIterator(structure: Structure): LocationIterator
    getLoci(pickingId: PickingId, structure: Structure, id: number): Loci
    mark(loci: Loci, action: MarkerAction, structure: Structure, values: MarkerData): void
}

export function ComplexMeshVisual<P extends StructureMeshProps>(builder: ComplexMeshVisualBuilder<P>): ComplexVisual<P> {
    const { defaultProps, createMesh, createLocationIterator, getLoci, mark } = builder

    let renderObject: MeshRenderObject
    let currentProps: P
    let mesh: Mesh
    let currentStructure: Structure

    return {
        get renderObject () { return renderObject },
        async create(ctx: RuntimeContext, structure: Structure, props: Partial<P> = {}) {
            currentProps = Object.assign({}, defaultProps, props)
            currentStructure = structure

            mesh = await createMesh(ctx, currentStructure, currentProps, mesh)

            const locationIt = createLocationIterator(structure)
            renderObject = createComplexMeshRenderObject(structure, mesh, locationIt, currentProps)
        },
        async update(ctx: RuntimeContext, props: Partial<P>) {
            const newProps = Object.assign({}, currentProps, props)

            if (!renderObject) return false

            let updateColor = false

            // TODO create in-place
            // if (currentProps.radialSegments !== newProps.radialSegments) return false

            if (!deepEqual(newProps.colorTheme, currentProps.colorTheme)) {
                updateColor = true
            }

            if (updateColor) {
                createColors(createLocationIterator(currentStructure), newProps.colorTheme, renderObject.values)
            }

            updateMeshValues(renderObject.values, newProps)
            updateRenderableState(renderObject.state, newProps)

            currentProps = newProps
            return false
        },
        getLoci(pickingId: PickingId) {
            return getLoci(pickingId, currentStructure, renderObject.id)
        },
        mark(loci: Loci, action: MarkerAction) {
            mark(loci, action, currentStructure, renderObject.values)
        },
        destroy() {
            // TODO
        }
    }
}