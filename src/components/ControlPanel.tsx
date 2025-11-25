import React from 'react';
import { Play, Pause, Info } from 'lucide-react';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';

interface ControlPanelProps {
  year: number;
  setYear: (y: number) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  viewMode: 'country' | 'continent';
  setViewMode: (m: 'country' | 'continent') => void;
  dataMode: 'absolute' | 'perCapita';
  setDataMode: (m: 'absolute' | 'perCapita') => void;
  yearRange: [number, number];
  totalEmissions: number;
}

export function ControlPanel({
  year,
  setYear,
  isPlaying,
  setIsPlaying,
  viewMode,
  setViewMode,
  _dataMode,
  _setDataMode,
  yearRange,
  totalEmissions,
}: ControlPanelProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col gap-4 pointer-events-none">
      {/* Timeline Control */}
      <Card className="pointer-events-auto p-4 bg-black/80 border-slate-800 text-slate-100 backdrop-blur-md mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-slate-100 hover:text-white hover:bg-slate-800"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>

          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between text-xs text-slate-400 uppercase font-medium tracking-wider">
              <span>{yearRange[0]}</span>
              <span className="text-white text-lg font-bold">{year}</span>
              <span>{yearRange[1]}</span>
            </div>
            <Slider
              value={[year]}
              min={yearRange[0]}
              max={yearRange[1]}
              step={1}
              onValueChange={vals => setYear(vals[0])}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Total Emissions Display */}
        <div className="mt-3 pt-3 border-t border-slate-800 text-center">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">
            Globale Gesamtemissionen
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.round(totalEmissions).toLocaleString('de-DE')}{' '}
            <span className="text-base text-slate-400 font-normal">Gt CO₂</span>
          </div>
        </div>
      </Card>

      {/* View & Data Toggles */}
      <div className="flex justify-between items-end">
        <Card className="pointer-events-auto p-4 bg-black/80 border-slate-800 text-slate-100 backdrop-blur-md space-y-4 w-64">
          <div className="space-y-3">
            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Ansichtsmodus
            </Label>
            <div className="flex bg-slate-900 rounded-lg p-1">
              <button
                onClick={() => setViewMode('country')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'country'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Länder
              </button>
              <button
                onClick={() => setViewMode('continent')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'continent'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Regionen
              </button>
            </div>
          </div>
          {/*
          <div className="space-y-3">
            <Label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Datenbasis</Label>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${dataMode === 'absolute' ? 'text-white' : 'text-slate-500'}`}>Absolut</span>
              <Switch
                checked={dataMode === 'perCapita'}
                onCheckedChange={(c) => setDataMode(c ? 'perCapita' : 'absolute')}
              />
              <span className={`text-sm ${dataMode === 'perCapita' ? 'text-white' : 'text-slate-500'}`}>Pro Kopf</span>
            </div>
          </div>
            */}
        </Card>

        {/* Data Source Info */}
        <div className="pointer-events-auto">
          <a
            href="https://climatetrace.org/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full text-xs text-slate-400 hover:text-white hover:bg-black/80 transition-colors border border-white/10"
          >
            <Info className="h-3 w-3" />
            <span>Datenquelle: Synthetic Mock Data (basierend auf EDGAR/GCP Trends)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
