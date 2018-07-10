import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Flow } from '../entities/flow.model';
import { EntitiesService } from '../entities/entities.service';
import { SearchService } from '../search/search.service';
import { SelectKeyValuesComponent } from '../select-key-values/select-key-values.component';
import { MapService } from '../map/map.service';
import { MdlDialogService } from '@angular-mdl/core';
import { PropertyType } from '../entities';

@Component({
  selector: 'app-harmonize-flow-options',
  templateUrl: './harmonize-flow-options.component.html',
  styleUrls: ['./harmonize-flow-options.component.scss']
})
export class HarmonizeFlowOptionsComponent implements OnInit, OnChanges {

  @Input() flow: Flow;
  @Output() onChange = new EventEmitter<any>();
  @Input() property: PropertyType;
  @Output() onRun: EventEmitter<any> = new EventEmitter();

  static readonly newLabel: string = 'New...';

  _isVisible: boolean = false;

  settings: any;
  mapName: string = null;
  keyVals: any;
  keyValTitle = 'Options';
  hasDocs: boolean = false;

  constructor(
    private searchService: SearchService,
    private mapService: MapService,
    private router: Router,
    private entitiesService: EntitiesService,
    private dialogService: MdlDialogService
  ) {}

  setDefaults() {
    this.settings = {
      batchSize: 100,
      threadCount: 4,
      options: {}
    };
    this.keyVals = [{
      key: '',
      val: ''
    }];
  }

  ngOnInit() {
    this.setDefaults();
    this.loadMap(this.flow.flowName);
    this.loadSettings(this.flow.flowName);
    this.docsLoaded(this.flow.entityName);
    this.saveSettings();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.setDefaults();
    this.loadMap(changes.flow.currentValue.flowName);
    this.loadSettings(changes.flow.currentValue.flowName);
    this.docsLoaded(changes.flow.currentValue.entityName);
  }

  updateKayVals(newKeyVals) {
    this.keyVals = newKeyVals;
    this.saveSettings();
  }

  runHarmonize(): void {
    this.keyVals.forEach(function (kv) {
      if (kv.key !== '' && kv.val !== '') {
        this.settings.options[kv.key] = kv.val;
      }
    }, this);
    this.onRun.emit(this.settings);
  }

  loadMap(flowName) {
    let localString = localStorage.getItem("mapping");
    if (localString) {
      let localObj = JSON.parse(localString);
      if (localObj[this.flow.entityName]) {
        if (localObj[this.flow.entityName][flowName]) {
          this.mapName = localObj[this.flow.entityName][flowName].name;
        }
      }
    }
  }

  deleteMap() {
    let result = this.dialogService.confirm('Delete map?', 'Cancel', 'Delete');
    result.subscribe( () => {
      // Temporarily saving locally
      let localString = localStorage.getItem("mapping");
      let localObj = {};
      if (localString) {
        let localObj = JSON.parse(localString);
        if (localObj[this.flow.entityName]) {
          if (localObj[this.flow.entityName][this.flow.flowName]) {
            delete localObj[this.flow.entityName][this.flow.flowName];
            this.mapName = null;
          }
        }
      }
      // TODO use service to delete
      let mapName = this.mapService.getName(this.flow.entityName, this.flow.flowName);
      this.mapService.deleteMap(this.flow.entityName, mapName);
      localStorage.setItem("mapping", JSON.stringify(localObj));
      this.saveSettings();
      },
      (err: any) => {
        console.log('map delete canceled');
      }
    );
  }

  loadSettings(flowName) {
    let localString = localStorage.getItem("flowSettings");
    if (localString) {
      let localObj = JSON.parse(localString);
      if (localObj[flowName]) {
        this.settings.batchSize = localObj[flowName].batchSize,
        this.settings.threadCount = localObj[flowName].threadCount,
        this.settings.map = localObj[flowName].map,
        this.keyVals = localObj[flowName].keyVals;
      }
    }
  }

  saveSettings() {
    let localString = localStorage.getItem("flowSettings");
    let localObj = {};
    if (localString) {
      localObj = JSON.parse(localString);
    }
    localObj[this.flow.flowName] = {
      batchSize: this.settings.batchSize,
      threadCount: this.settings.threadCount,
      map: this.settings.map,
      keyVals: this.keyVals
    }
    localStorage.setItem("flowSettings", JSON.stringify(localObj));
    // save to file
    this.keyVals.forEach(function (kv) {
      if (kv.key !== '' && kv.val !== '') {
        this.settings.options[kv.key] = kv.val;
      }
    }, this);
    this.entitiesService.saveHarmonizeFlowOptions(
      this.flow, this.settings.batchSize, this.settings.threadCount, {name: this.mapName}, this.settings.options
    );
  }

  deleteSettings(flowName) {
    let localString = localStorage.getItem("flowSettings");
    let localObj = {};
    if (localString) {
      localObj = JSON.parse(localString);
      delete localObj[flowName];
    }
    localStorage.setItem("flowSettings", JSON.stringify(localObj));
  }

  /**
   * Check if documents for entity have been input.
   */
  docsLoaded(entityName): void {
    let activeFacets = { Collection: {
      values: [entityName]
    }};
    this.searchService.getResults('STAGING', false, null, activeFacets, 1, 1)
      .subscribe(response => {
      this.hasDocs = (response.results.length > 0);
    },
    () => {},
    () => {});
  }

  get invalidString(): boolean
  {
    if(this.property.name.indexOf(" ") != -1)
    {
      return true;
    }
    return false;
  }

}
