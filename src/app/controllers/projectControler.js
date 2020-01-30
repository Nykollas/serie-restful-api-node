const express = require('express');
const authMiddleware = require("../middlewares/auth");  
const Project = require("../models/Project");
const Task = require("../models/Task");
const router = express.Router();

router.use(authMiddleware);

//List
router.get("/", async (req, res) => {
    try{   
        const projects = await Project.find().populate(["user", "tasks"]);
        if(!projects){
            res.status(400).send({error:'Theres not projects'});
        }
        res.send({projects});
    }catch(err){
        console.log(err);
        return res.status(400).send({error:'Error loading projects'});
    }
});

//Show
router.get('/:projectId', async (req, res) =>  {
    try{
        const project = await Project.findById(req.params.projectId)
                                      .populate(['user', 'tasks']);
        if(!project){
            res.status(400).send({error:'Project not found'});
        }
        return res.send({project});
    }catch(err){
        return res.status(400).send({error:'Error loading projects'});
    }
});

//Create
router.post('/', async (req, res) => {
    try{

        const {title, description, tasks } = req.body;

        const project = await Project.create({title, description, user:req.userId});
        await tasks.map( task => {
          const projectTask =  new Task({ ...task, project:project._id });  
          projectTask.save().then( task =>  project.tasks.push(task));
        });

        await project.save();

        return res.send({project}); 

    }catch(err){
        console.log(err);
        return  res.status(400).send({error:'Error creating new project'});
    }
});

//Update
router.put('/:projectId', async (req, res) => {
    try{
        const { title,  description,tasks }  = req.body;
        const project = await Project.findByIdAndUpdate(req.params.projectId, {
            title,
            description,},
            {new:true}
        );
        project.tasks = [];
        await Task.remove({project:project._id});
        await tasks.map( task => {
            const projectTask =  new Task({ ...task, project:project._id });  
            projectTask.save().then( task =>  project.tasks.push(task));
          });
  
          await project.save();
          return res.send({project}); 

    }catch(err){
        console.log(err);
        res.status(400).send({error:"Error updating project, try again."});
    }
});

//Delete
router.delete('/:projectId', async (req, res) => {
    try{
        await Project.findByIdAndRemove(req.params.projectId);
        return res.send();
    }catch(err){
        res.status(400).send("Can't remove project, try again");
    }
});

module.exports =  app => app.use("/projects", router);      