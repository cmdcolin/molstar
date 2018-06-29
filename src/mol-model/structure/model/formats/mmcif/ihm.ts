/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { mmCIF_Database as mmCIF, mmCIF_Schema } from 'mol-io/reader/cif/schema/mmcif'
import { CoarseHierarchy, CoarseConformation, CoarseElementData, CoarseSphereConformation, CoarseGaussianConformation } from '../../properties/coarse'
import { Entities } from '../../properties/common';
import { Column } from 'mol-data/db';
import { getCoarseKeys } from '../../properties/utils/coarse-keys';
import { UUID } from 'mol-util';
import { Segmentation, Interval } from 'mol-data/int';
import { Mat3, Tensor } from 'mol-math/linear-algebra';
import { Element } from '../../../structure'

export interface IHMData {
    model_id: number,
    model_name: string,
    entities: Entities,
    atom_site: mmCIF['atom_site'],
    ihm_sphere_obj_site: mmCIF['ihm_sphere_obj_site'],
    ihm_gaussian_obj_site: mmCIF['ihm_gaussian_obj_site']
}

export const EmptyIHMCoarse = { hierarchy: CoarseHierarchy.Empty, conformation: void 0 as any }

export function getIHMCoarse(data: IHMData): { hierarchy: CoarseHierarchy, conformation: CoarseConformation } {
    const { ihm_sphere_obj_site, ihm_gaussian_obj_site } = data;

    if (ihm_sphere_obj_site._rowCount === 0 && ihm_gaussian_obj_site._rowCount === 0) return EmptyIHMCoarse;

    const sphereData = getData(ihm_sphere_obj_site);
    const sphereConformation = getSphereConformation(ihm_sphere_obj_site);
    const sphereKeys = getCoarseKeys(sphereData, data.entities);

    const gaussianData = getData(ihm_gaussian_obj_site);
    const gaussianConformation = getGaussianConformation(ihm_gaussian_obj_site);
    const gaussianKeys = getCoarseKeys(gaussianData, data.entities);

    return {
        hierarchy: {
            isDefined: true,
            spheres: { ...sphereData, ...sphereKeys },
            gaussians: { ...gaussianData, ...gaussianKeys },
        },
        conformation: {
            id: UUID.create(),
            spheres: sphereConformation,
            gaussians: gaussianConformation
        }
    };
}

function getSphereConformation(data: mmCIF['ihm_sphere_obj_site']): CoarseSphereConformation {
    return {
        x: data.Cartn_x.toArray({ array: Float32Array }),
        y: data.Cartn_y.toArray({ array: Float32Array }),
        z: data.Cartn_z.toArray({ array: Float32Array }),
        radius: data.object_radius.toArray({ array: Float32Array }),
        rmsf: data.rmsf.toArray({ array: Float32Array })
    };
}

function getGaussianConformation(data: mmCIF['ihm_gaussian_obj_site']): CoarseGaussianConformation {
    const matrix_space = mmCIF_Schema.ihm_gaussian_obj_site.covariance_matrix.space;
    const covariance_matrix: Mat3[] = [];
    const { covariance_matrix: cm } = data;

    for (let i = 0, _i = cm.rowCount; i < _i; i++) {
        covariance_matrix[i] = Tensor.toMat3(matrix_space, cm.value(i));
    }

    return {
        x: data.mean_Cartn_x.toArray({ array: Float32Array }),
        y: data.mean_Cartn_y.toArray({ array: Float32Array }),
        z: data.mean_Cartn_z.toArray({ array: Float32Array }),
        weight: data.weight.toArray({ array: Float32Array }),
        covariance_matrix
    };
}

function getSegments(asym_id: Column<string>, seq_id_begin: Column<number>, seq_id_end: Column<number>) {
    const polymerOffsets = [0 as Element], chainOffsets = [0 as Element];
    for (let i = 1, _i = asym_id.rowCount; i < _i; i++) {
        const newChain = !asym_id.areValuesEqual(i - 1, i);
        const newPolymer = newChain
            || seq_id_end.value(i - 1) !== seq_id_begin.value(i) - 1;

        if (newPolymer) polymerOffsets[polymerOffsets.length] = i as Element;
        if (newChain) chainOffsets[chainOffsets.length] = i as Element;
    }

    return {
        chainSegments: Segmentation.ofOffsets(chainOffsets, Interval.ofBounds(0, asym_id.rowCount)),
        polymerSegments: Segmentation.ofOffsets(polymerOffsets, Interval.ofBounds(0, asym_id.rowCount))
    }
}

function getData(data: mmCIF['ihm_sphere_obj_site'] | mmCIF['ihm_gaussian_obj_site']): CoarseElementData {
    const { entity_id, seq_id_begin, seq_id_end, asym_id } = data;
    return { count: entity_id.rowCount, entity_id, asym_id, seq_id_begin, seq_id_end, ...getSegments(asym_id, seq_id_begin, seq_id_end) };
}