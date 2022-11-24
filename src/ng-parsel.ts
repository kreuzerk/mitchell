import { tsquery } from '@phenomnomnominal/tsquery';
import { readFileSync, writeFileSync } from 'fs';
import * as glob from 'glob';

import { investigateType } from './investigator';
import { parseSpec } from './parser/spec/spec.parser';
import { parsePipe } from './parser/pipe/pipe.parser';
import { parseModule } from './parser/module/module.parser';
import { parseDirective } from './parser/directive/directive.parser';
import { parseComponent } from './parser/component/component.parser';
import { NgParselBuildingBlockType } from './parser/shared/model/types.model';
import { NgParselConfig } from './config/config.model';
import { NgParselComponent } from './parser/component/component.model';
import { NgParselModule } from './parser/module/module.model';
import { NgParselDirective } from './parser/directive/directive.model';
import { NgParselSpec } from './parser/spec/spec.model';
import { NgParselPipe } from './parser/pipe/pipe.model';

export function parse(configuration: NgParselConfig): void {
  const directoryGlob = `${configuration.src}/**/*.{ts,html,scss,css,less}`;
  glob.sync(directoryGlob).forEach((filePath) => {
    const source = readFileSync(filePath, 'utf8');
    const ast = tsquery.ast(source);
    const componentType = investigateType(ast, filePath);

    let ngParselComponent, ngParselSpec, ngParselPipe, ngParselModule, ngParselDirective;

    if (configuration.parseComponents && componentType === NgParselBuildingBlockType.COMPONENT) {
      ngParselComponent = parseComponent(ast, filePath);
    }

    if (configuration.parseSpecs && componentType === NgParselBuildingBlockType.SPEC) {
      ngParselSpec = parseSpec(ast, filePath);
    }

    if (configuration.parseModules && componentType === NgParselBuildingBlockType.MODULE) {
      ngParselModule = parseModule(ast);
    }

    if (configuration.parseDirectives && componentType === NgParselBuildingBlockType.DIRECTIVE) {
      ngParselDirective = parseDirective(ast, filePath);
    }

    if (configuration.parsePipes && componentType === NgParselBuildingBlockType.PIPE) {
      ngParselPipe = parsePipe(ast, filePath);
    }
    writeOutputFiles(configuration, ngParselComponent, ngParselDirective, ngParselModule, ngParselSpec, ngParselPipe);
  });
}

function writeOutputFiles(
  config: NgParselConfig,
  ngParselComponent: NgParselComponent | undefined,
  ngParselDirective: NgParselDirective | undefined,
  ngParselModule: NgParselModule | undefined,
  ngParselSpec: NgParselSpec | undefined,
  ngParselPipe: NgParselPipe | undefined
): void {
  if (config.singleFile) {
    writeFileSync(
      `${config.out}/ng-parsel.json`,
      JSON.stringify({
        ...ngParselComponent,
        ...ngParselModule,
        ...ngParselDirective,
        ...ngParselDirective,
      })
    );
  } else {
    if (ngParselComponent) {
      writeFileSync(`${config.out}/ng-parsel-component.json`, JSON.stringify(ngParselComponent));
    }

    if (ngParselModule) {
      writeFileSync(`${config.out}/ng-parsel-module.json`, JSON.stringify(ngParselModule));
    }

    if (ngParselDirective) {
      writeFileSync(`${config.out}/ng-parsel-directive.json`, JSON.stringify(ngParselDirective));
    }

    if (ngParselPipe) {
      writeFileSync(`${config.out}/ng-parsel-pipe.json`, JSON.stringify(ngParselPipe));
    }

    if (ngParselSpec) {
      writeFileSync(`${config.out}/ng-parsel-spec.json`, JSON.stringify(ngParselSpec));
    }
  }
}
