/*
 * Copyright 2012-2018 MarkLogic Corporation
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */

package com.marklogic.quickstart.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marklogic.hub.HubConfig;
import com.marklogic.quickstart.model.HubSettings;
import com.marklogic.quickstart.model.Project;
import com.marklogic.quickstart.model.ProjectInfo;
import com.marklogic.quickstart.service.ProjectManagerService;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;

import java.io.IOException;
import java.util.Collection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringBootTest
@WebAppConfiguration
public class ProjectsControllerTest extends BaseTestController {

    @Autowired
    private ProjectsController pc;

    @Autowired
    private ProjectManagerService pms;

    private TemporaryFolder temporaryFolder;

    private String projectPath;
    @Before
    public void setup() throws IOException {
        pms.reset();
        temporaryFolder = new TemporaryFolder();
        temporaryFolder.create();
        projectPath = temporaryFolder.newFolder("my-project").toString();
    }

    @After
    public void teardownDir() {
        temporaryFolder.delete();
    }

    @Test
    public void getProjects() {
        assertEquals(0, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());
        assertEquals(false, pc.getProjects().keySet().contains("lastProject"));

        pc.addProject(projectPath);
        assertEquals(1, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());
        assertEquals(null, pc.getProjects().get("lastProject"));
    }

    @Test
    public void addProject() throws IOException {
        assertEquals(0, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());

        Project project = pc.addProject(projectPath);
        assertEquals(projectPath, project.path);
        assertEquals(1, project.id);
        assertEquals(false, project.isInitialized());
    }

    @Test
    public void getProject() {
        assertEquals(0, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());
        assertEquals(false, pc.getProjects().keySet().contains("lastProject"));

        pc.addProject(projectPath);

        Project project = pc.getProject(1);
        assertEquals(projectPath, project.path);
        assertEquals(1, project.id);
        assertEquals(false, project.isInitialized());
    }

    @Test
    public void removeProject() {
        assertEquals(0, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());

        pc.addProject(projectPath);
        assertEquals(1, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());

        pc.removeProject(1);
        assertEquals(0, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());

    }

    @Test
    public void initializeProject() {
        assertEquals(0, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());

        pc.addProject(projectPath);
        assertEquals(1, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());

        ObjectMapper objectMapper = new ObjectMapper();
        pc.initializeProject(1, objectMapper.valueToTree(envConfig.getMlSettings()));

        assertTrue(pc.getProject(1).isInitialized());
    }

    @Test
    public void getDefaults() {
        assertEquals(0, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());

        pc.addProject(projectPath);
        assertEquals(1, ((Collection<ProjectInfo>)pc.getProjects().get("projects")).size());

        HubSettings hubSettings = pc.getDefaults(1);
        assertEquals(projectPath, hubSettings.getProjectDir());
    }

}
