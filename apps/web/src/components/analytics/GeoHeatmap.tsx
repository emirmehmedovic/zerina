"use client";

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { FeatureCollection } from 'geojson';

interface GeoData {
  country: string;
  orders: number;
}

interface GeoHeatmapProps {
  data: GeoData[];
}

export default function GeoHeatmap({ data }: GeoHeatmapProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    const width = 500;
    const height = 300;

    const projection = d3.geoMercator().scale(80).translate([width / 2, height / 1.5]);
    const path = d3.geoPath().projection(projection);

    svg.selectAll('*').remove();

    d3.json<any>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(world => {
      if (!world) return;
      const countries = topojson.feature(world, world.objects.countries) as unknown as FeatureCollection;

      const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, d3.max(data, d => d.orders) || 1]);

      svg.selectAll('path')
        .data(countries.features)
        .enter().append('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const countryData = data.find(c => c.country === d.properties.name);
          return countryData ? colorScale(countryData.orders) : '#334155';
        })
        .attr('stroke', '#1e293b');
    });
  }, [data]);

  return <svg ref={ref} width={500} height={300} />;
}
